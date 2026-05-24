import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type {
  ScatterGatherOptions,
  ScatterGatherResult,
  ScatterGatherStatus,
  WorkerResult,
} from './types';

export function useScatterGather<T, R>(
  options: ScatterGatherOptions<T, R> & { input: T }
): ScatterGatherResult<R> & {
  data: ScatterGatherResult<R> | null;
  status: ScatterGatherStatus;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
} {
  const {
    workers,
    input,
    timeout = 30000,
    retryAttempts = 1,
    strategy = 'all',
    minSuccessCount,
    enabled = true,
    staleTime = 0,
    gcTime = 5 * 60 * 1000,
  } = options;

  const workerEntries = Object.entries(workers);
  const minRequired = minSuccessCount ?? workerEntries.length;

  const queries = useQueries({
    queries: workerEntries.map(([workerId, workerFn]) => ({
      queryKey: ['scatter-gather', workerId, input],
      queryFn: async () => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Worker ${workerId} timed out`)), timeout);
        });

        const result = await Promise.race([
          workerFn(input),
          timeoutPromise,
        ]);

        return { workerId, result } satisfies WorkerResult<R>;
      },
      retry: retryAttempts,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      enabled,
      staleTime,
      gcTime,
    })),
  });

  const consolidatedResult = useMemo(() => {
    const startTime = performance.now();
    const results = new Map<string, R>();
    const failed = new Map<string, Error>();

    queries.forEach((query, index) => {
      const workerId = workerEntries[index][0];
      if (query.isSuccess && query.data) {
        results.set(workerId, query.data.result);
      } else if (query.isError && query.error) {
        failed.set(workerId, query.error as Error);
      }
    });

    const metadata = {
      totalWorkers: workerEntries.length,
      successfulWorkers: results.size,
      failedWorkers: failed.size,
      totalTime: performance.now() - startTime,
    };

    return { results, failed, metadata } satisfies ScatterGatherResult<R>;
  }, [queries, workerEntries]);

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

  const status: ScatterGatherStatus = useMemo(() => {
    if (queries.some(q => q.isLoading)) return 'pending';
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
