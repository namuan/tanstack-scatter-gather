import { useState } from 'react';
import { useScatterGather } from '../useScatterGather';

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

export const SearchAggregator = () => {
  const [query, setQuery] = useState('');

  const { results, metadata, status, isLoading, isError, refetch } = useScatterGather({
    workers,
    input: query,
    timeout: 5000,
    retryAttempts: 2,
    strategy: 'majority',
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
        </div>
      )}

      {isError && <div className="error">Search failed: Unable to gather enough results</div>}

      {(status === 'success') && (
        <div className="results">
          <div className="metadata">
            <small>
              Found results from {metadata.successfulWorkers}/{metadata.totalWorkers} sources
              {' '}in {metadata.totalTime.toFixed(2)}ms
            </small>
          </div>

          <div className="search-results">
            {Array.from(results.entries()).map(([source, sourceResults]) => (
              <div key={source} className="source-results">
                <h3>{source.toUpperCase()} ({(sourceResults as any[]).length} results)</h3>
                {(sourceResults as any[]).slice(0, 5).map((result: any, idx: number) => (
                  <div key={idx} className="result-item">
                    {JSON.stringify(result)}
                  </div>
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
