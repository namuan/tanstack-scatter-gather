import { useState, type FC } from 'react';
import { SearchAggregator } from '../examples/SearchAggregator.js';
import { DashboardWidget } from '../examples/DashboardWidget.js';
import { ProgressiveImageAnalyzer } from '../examples/ProgressiveImageAnalyzer.js';

const tabs = [
  { id: 'search', label: 'Search Aggregator', component: SearchAggregator },
  { id: 'dashboard', label: 'Dashboard', component: DashboardWidget },
  { id: 'analyzer', label: 'Image Analyzer', component: ProgressiveImageAnalyzer },
] as const;

export const App: FC = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('search');

  const ActiveComponent = tabs.find(t => t.id === activeTab)!.component;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Scatter-Gather Demo</h1>
      <p style={{ marginTop: 0, color: '#666' }}>
        Mock server running at <code>http://localhost:4000</code>
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #eee' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #0066cc' : '2px solid transparent',
              marginBottom: -2,
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#0066cc' : '#666',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
};
