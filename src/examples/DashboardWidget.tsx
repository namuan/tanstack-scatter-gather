import { useScatterGather } from '../useScatterGather';

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
    return Promise.resolve(JSON.parse(localStorage.getItem('dashboardCache') || '{}'));
  },
};

export const DashboardWidget = () => {
  const { results, failed, metadata, isPending, refetch } = useScatterGather({
    workers,
    input: null as any,
    timeout: 8000,
    strategy: 'all',
    staleTime: 60000,
  });

  if (isPending) {
    return <div>Loading dashboard from {Object.keys(workers).length} sources...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button onClick={() => refetch()}>Refresh All</button>
        <div className="status">
          Loaded {results.size}/{metadata.totalWorkers} sources
          {failed.size > 0 && (
            <span className="warning">
              {' '}{failed.size} source(s) unavailable
            </span>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        {Array.from(results.entries()).map(([source, data]) => (
          <div key={source} className="dashboard-card">
            <h3>{source}</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        ))}

        {Array.from(failed.entries()).map(([source, error]) => (
          <div key={source} className="error-card">
            <h3>{source}</h3>
            <p className="error">{error.message}</p>
            <button onClick={() => refetch()}>Retry</button>
          </div>
        ))}
      </div>
    </div>
  );
};
