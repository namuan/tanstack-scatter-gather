Here's how to implement the Scatter-Gather pattern using TanStack Query (React Query) for a client-side app:

## Core Implementation

```typescript
// types.ts
interface ScatterGatherOptions<T, R> {
  workers: Record<string, (input: T) => Promise<R>>;
  timeout?: number;
  retryAttempts?: number;
  strategy?: 'all' | 'majority' | 'first';
  minSuccessCount?: number;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

interface ScatterGatherResult<R> {
  results: Map<string, R>;
  failed: Map<string, Error>;
  metadata: {
    totalWorkers: number;
    successfulWorkers: number;
    failedWorkers: number;
    totalTime: number;
  };
}

// useScatterGather hook
import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';

export function useScatterGather<T, R>({
  workers,
  input,
  timeout = 30000,
  retryAttempts = 1,
  strategy = 'all',
  minSuccessCount,
  enabled = true,
  staleTime = 0,
  cacheTime = 5 * 60 * 1000,
}: ScatterGatherOptions<T, R> & { input: T }) {
  
  const workerEntries = Object.entries(workers);
  const minRequired = minSuccessCount ?? workerEntries.length;
  
  // Create individual queries for each worker
  const queries = useQueries({
    queries: workerEntries.map(([workerId, workerFn]) => ({
      queryKey: ['scatter-gather', workerId, input],
      queryFn: async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Worker ${workerId} timed out`)), timeout);
        });
        
        const result = await Promise.race([
          workerFn(input),
          timeoutPromise,
        ]);
        
        return { workerId, result };
      },
      retry: retryAttempts,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      enabled,
      staleTime,
      gcTime: cacheTime, // Note: cacheTime is now gcTime in v5
      onError: (error: Error) => {
        console.error(`Worker ${workerId} failed:`, error);
      },
    })),
  });

  // Consolidate results based on strategy
  const consolidatedResult = useMemo(() => {
    const startTime = performance.now();
    const results = new Map<string, R>();
    const failed = new Map<string, Error>();
    
    queries.forEach((query, index) => {
      const workerId = workerEntries[index][0];
      if (query.isSuccess && query.data) {
        results.set(workerId, query.data.result);
      } else if (query.isError && query.error) {
        failed.set(workerId, query.error);
      }
    });

    const metadata = {
      totalWorkers: workerEntries.length,
      successfulWorkers: results.size,
      failedWorkers: failed.size,
      totalTime: performance.now() - startTime,
    };

    return { results, failed, metadata };
  }, [queries, workerEntries]);

  // Apply strategy logic
  const isValid = useMemo(() => {
    switch (strategy) {
      case 'first':
        return consolidatedResult.results.size > 0;
      case 'majority':
        return consolidatedResult.results.size > workerEntries.length / 2;
      case 'all':
      default:
        return consolidatedResult.results.size >= minRequired;
    }
  }, [strategy, consolidatedResult.results.size, workerEntries.length, minRequired]);

  // Compute combined status
  const status = useMemo(() => {
    if (queries.some(q => q.isLoading)) return 'pending';
    if (queries.some(q => q.isError) && !isValid) return 'error';
    if (isValid) return 'success';
    return 'error';
  }, [queries, isValid]);

  return {
    data: isValid ? consolidatedResult : null,
    results: consolidatedResult.results,
    failed: consolidatedResult.failed,
    metadata: consolidatedResult.metadata,
    status,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    isLoading: queries.some(q => q.isLoading),
    isFetching: queries.some(q => q.isFetching),
    refetch: () => queries.forEach(q => q.refetch()),
  };
}
```

## Advanced Implementation with Parallel Queries

```typescript
// useParallelScatterGather.ts - More efficient for large worker pools
import { useQueryClient, UseQueryOptions } from '@tanstack/react-query';

export function useParallelScatterGather<T, R>({
  workers,
  input,
  batchSize = 5,
  ...options
}: ScatterGatherOptions<T, R> & { input: T; batchSize?: number }) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ completed: 0, total: Object.keys(workers).length });

  const workerIds = Object.keys(workers);
  
  // Process workers in batches to avoid overwhelming the system
  const batches = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < workerIds.length; i += batchSize) {
      result.push(workerIds.slice(i, i + batchSize));
    }
    return result;
  }, [workerIds, batchSize]);

  const queryResults = useQueries({
    queries: workerIds.flatMap(workerId => {
      const workerFn = workers[workerId];
      return [{
        queryKey: ['scatter', workerId, input],
        queryFn: async () => {
          const result = await workerFn(input);
          setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
          return { workerId, result };
        },
        ...options,
      }];
    }),
  });

  // Progressive result accumulation
  const progressiveResults = useMemo(() => {
    const results = new Map<string, R>();
    const failed = new Map<string, Error>();
    
    queryResults.forEach((query, index) => {
      const workerId = workerIds[index];
      if (query.isSuccess && query.data) {
        results.set(workerId, query.data.result);
      } else if (query.isError && query.error) {
        failed.set(workerId, query.error);
      }
    });
    
    return { results, failed, progress: progress.completed / progress.total };
  }, [queryResults, workerIds, progress]);

  return {
    ...progressiveResults,
    progress: progress.completed / progress.total,
    isComplete: progress.completed === progress.total,
    isPartial: progress.completed > 0 && progress.completed < progress.total,
  };
}
```

## React Component Examples

```tsx
// Example 1: Search Aggregator Component
import { useScatterGather } from './useScatterGather';

const SearchAggregator = () => {
  const [query, setQuery] = useState('');
  
  const workers = {
    google: async (searchTerm: string) => {
      const res = await fetch(`/api/search/google?q=${searchTerm}`);
      return res.json();
    },
    bing: async (searchTerm: string) => {
      const res = await fetch(`/api/search/bing?q=${searchTerm}`);
      return res.json();
    },
    duckduckgo: async (searchTerm: string) => {
      const res = await fetch(`/api/search/ddg?q=${searchTerm}`);
      return res.json();
    },
  };

  const { data, results, metadata, status, isLoading, isError, refetch } = useScatterGather({
    workers,
    input: query,
    timeout: 5000,
    retryAttempts: 2,
    strategy: 'majority', // Accept results from at least 2 sources
    enabled: query.length > 2,
  });

  return (
    <div className="search-container">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      
      {isLoading && (
        <div className="loading-indicator">
          <p>Searching across {Object.keys(workers).length} sources...</p>
          <div className="progress-bar">
            {/* Show individual worker status */}
            {Object.keys(workers).map(worker => (
              <WorkerStatus key={worker} name={worker} />
            ))}
          </div>
        </div>
      )}
      
      {isError && <div className="error">Search failed: Unable to gather enough results</div>}
      
      {data && status === 'success' && (
        <div className="results">
          <div className="metadata">
            <small>
              Found results from {metadata.successfulWorkers}/{metadata.totalWorkers} sources
              in {metadata.totalTime.toFixed(2)}ms
            </small>
          </div>
          
          <div className="search-results">
            {Array.from(results.entries()).map(([source, sourceResults]) => (
              <div key={source} className="source-results">
                <h3>{source.toUpperCase()} ({sourceResults.length} results)</h3>
                {sourceResults.slice(0, 5).map((result: any, idx: number) => (
                  <ResultItem key={idx} result={result} source={source} />
                ))}
              </div>
            ))}
          </div>
          
          <button onClick={() => refetch()}>Refresh</button>
        </div>
      )}
    </div>
  );
};

// Example 2: Dashboard with Multiple Data Sources
const DashboardWidget = () => {
  const workers = {
    analytics: async () => {
      const res = await fetch('/api/analytics/dashboard');
      return res.json();
    },
    userData: async () => {
      const res = await fetch('/api/users/current');
      return res.json();
    },
    notifications: async () => {
      const res = await fetch('/api/notifications/unread');
      return res.json();
    },
    localStorage: async () => {
      // Synchronous data source
      return Promise.resolve(JSON.parse(localStorage.getItem('dashboardCache') || '{}'));
    },
  };

  const { data, results, failed, metadata, isPending, refetch } = useScatterGather({
    workers,
    input: null as any, // No input needed
    timeout: 8000,
    strategy: 'all', // Need all data for dashboard
    staleTime: 60000, // Cache for 1 minute
  });

  if (isPending) {
    return <DashboardSkeleton sources={Object.keys(workers)} />;
  }

  // Even if some workers fail, we can still show partial data
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button onClick={() => refetch()}>Refresh All</button>
        <div className="status">
          Loaded {results.size}/{metadata.totalWorkers} sources
          {failed.size > 0 && (
            <span className="warning">
              ⚠️ {failed.size} source(s) unavailable
            </span>
          )}
        </div>
      </div>
      
      <div className="dashboard-grid">
        {Array.from(results.entries()).map(([source, data]) => (
          <DashboardCard key={source} title={source} data={data} />
        ))}
        
        {Array.from(failed.entries()).map(([source, error]) => (
          <ErrorCard key={source} title={source} error={error} onRetry={refetch} />
        ))}
      </div>
    </div>
  );
};

// Example 3: Progressive Loading Component
const ProgressiveImageAnalyzer = () => {
  const [imageUrl, setImageUrl] = useState('');
  
  const analysisWorkers = {
    objectDetection: async (url: string) => {
      const res = await fetch('/api/analyze/detect-objects', { body: JSON.stringify({ url }) });
      return res.json();
    },
    textExtraction: async (url: string) => {
      const res = await fetch('/api/analyze/extract-text', { body: JSON.stringify({ url }) });
      return res.json();
    },
    colorAnalysis: async (url: string) => {
      const res = await fetch('/api/analyze/colors', { body: JSON.stringify({ url }) });
      return res.json();
    },
    qualityCheck: async (url: string) => {
      const res = await fetch('/api/analyze/quality', { body: JSON.stringify({ url }) });
      return res.json();
    },
  };

  const { results, progress, isComplete, isPartial } = useParallelScatterGather({
    workers: analysisWorkers,
    input: imageUrl,
    batchSize: 2, // Process 2 analyses at a time
    enabled: !!imageUrl,
  });

  return (
    <div>
      <input 
        type="text" 
        value={imageUrl} 
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Enter image URL"
      />
      
      {isPartial && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
          <p>Analyzing image... {Math.round(progress * 100)}% complete</p>
        </div>
      )}
      
      {isComplete && (
        <div className="analysis-results">
          {Array.from(results.entries()).map(([analyzer, result]) => (
            <AnalysisResult key={analyzer} type={analyzer} data={result} />
          ))}
        </div>
      )}
    </div>
  );
};
```

## Advanced Features with TanStack Query

```typescript
// Custom hook with automatic retry and fallback strategies
export function useResilientScatterGather<T, R>(options: ScatterGatherOptions<T, R> & { input: T }) {
  const queryClient = useQueryClient();
  const [fallbackUsed, setFallbackUsed] = useState(false);
  
  const result = useScatterGather({
    ...options,
    retryAttempts: 2,
  });
  
  // Implement fallback mechanism
  useEffect(() => {
    if (result.isError && !fallbackUsed) {
      const fallbackWorkers = Object.entries(options.workers).reduce((acc, [id, fn]) => {
        acc[`${id}_fallback`] = async (input: T) => {
          try {
            return await fn(input);
          } catch {
            // Return cached data if available
            const cached = queryClient.getQueryData(['scatter-gather', id, input]);
            if (cached) return cached;
            throw new Error(`No fallback available for ${id}`);
          }
        };
        return acc;
      }, {} as Record<string, (input: T) => Promise<R>>);
      
      // Retry with fallback workers
      setFallbackUsed(true);
      result.refetch();
    }
  }, [result.isError]);
  
  return {
    ...result,
    fallbackUsed,
  };
}

// Cache management for scatter-gather results
export function useCachedScatterGather<T, R>(options: ScatterGatherOptions<T, R> & { input: T }) {
  const queryClient = useQueryClient();
  
  const result = useScatterGather(options);
  
  // Cache individual worker results for future use
  useEffect(() => {
    if (result.isSuccess) {
      result.results.forEach((workerResult, workerId) => {
        queryClient.setQueryData(
          [`worker-${workerId}`, options.input],
          workerResult
        );
      });
    }
  }, [result.results, result.isSuccess, options.input]);
  
  return result;
}
```

## Key Benefits with TanStack Query:

1. **Automatic Caching**: Results are cached based on input
2. **Background Refetching**: Can refresh data in background
3. **Optimistic Updates**: Can show cached data while fetching
4. **Request Deduplication**: Multiple components using same query share results
5. **Retry Logic**: Built-in with exponential backoff
6. **Window Focus Refetching**: Auto-refresh when user returns to tab
7. **Parallel Query Management**: Built-in `useQueries` handles concurrency
8. **DevTools Integration**: Debug scatter-gather operations easily

This integration provides a robust, production-ready implementation of the Scatter-Gather pattern with all the benefits of TanStack Query's cache management and reactivity system.