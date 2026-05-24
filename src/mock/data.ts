export const searchResults = {
  google: [
    { title: 'Understanding Scatter-Gather Pattern', url: 'https://example.com/scatter-gather', snippet: 'The scatter-gather pattern enables parallel processing across multiple workers...' },
    { title: 'Distributed Systems Design', url: 'https://example.com/distributed-systems', snippet: 'Learn about fan-out, scatter-gather, and other distributed system patterns...' },
    { title: 'TanStack Query Documentation', url: 'https://tanstack.com/query', snippet: 'Powerful asynchronous state management for React applications...' },
    { title: 'React Query v5 Migration Guide', url: 'https://tanstack.com/query/v5', snippet: 'Migrating to TanStack Query v5 brings improved performance and new features...' },
    { title: 'Parallel Data Fetching Patterns', url: 'https://example.com/parallel-fetching', snippet: 'Compare approaches for parallel data fetching in React applications...' },
  ],
  bing: [
    { title: 'Scatter-Gather in Microservices', url: 'https://example.com/microservices', snippet: 'Implementing the scatter-gather pattern in microservice architectures...' },
    { title: 'React Query: useQueries Deep Dive', url: 'https://example.com/usequeries', snippet: 'A comprehensive look at TanStack Querys useQueries hook for parallel requests...' },
    { title: 'Error Handling in Parallel Requests', url: 'https://example.com/error-handling', snippet: 'Strategies for handling partial failures in scatter-gather operations...' },
    { title: 'Caching Strategies for Aggregated Data', url: 'https://example.com/caching', snippet: 'How to effectively cache results from multiple data sources...' },
  ],
  duckduckgo: [
    { title: 'Scatter-Gather vs MapReduce', url: 'https://example.com/scatter-vs-mapreduce', snippet: 'Understanding the differences between scatter-gather and MapReduce patterns...' },
    { title: 'React Query and Parallelism', url: 'https://example.com/react-query-parallel', snippet: 'Maximizing performance with parallel queries in TanStack Query...' },
    { title: 'Building Resilient Data Pipelines', url: 'https://example.com/resilient-pipelines', snippet: 'How to build fault-tolerant data processing with retry and fallback mechanisms...' },
    { title: 'Frontend Performance Optimization', url: 'https://example.com/perf-optimization', snippet: 'Techniques for optimizing frontend data fetching and aggregation...' },
    { title: 'TypeScript Patterns for Async Operations', url: 'https://example.com/typescript-async', snippet: 'Type-safe patterns for managing asynchronous operations in TypeScript...' },
  ],
};

export const dashboardData = {
  analytics: {
    pageViews: 14250,
    uniqueVisitors: 3892,
    bounceRate: '34.2%',
    avgSessionDuration: '4m 32s',
    topPages: [
      { path: '/home', views: 5230 },
      { path: '/pricing', views: 2840 },
      { path: '/docs', views: 2190 },
    ],
    trafficSources: {
      organic: 45,
      direct: 28,
      referral: 18,
      social: 9,
    },
  },
  userData: {
    id: 'usr_8f7d3a',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'Admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    preferences: {
      theme: 'dark',
      notifications: true,
      timezone: 'UTC-5',
    },
    lastLogin: '2026-05-24T08:30:00Z',
  },
  notifications: {
    unread: 4,
    items: [
      { id: 'notif_001', type: 'alert', message: 'Server CPU usage exceeded 80%', timestamp: '2026-05-24T09:15:00Z', severity: 'warning' },
      { id: 'notif_002', type: 'info', message: 'New deployment completed successfully', timestamp: '2026-05-24T08:45:00Z', severity: 'info' },
      { id: 'notif_003', type: 'alert', message: 'SSL certificate expires in 7 days', timestamp: '2026-05-24T07:30:00Z', severity: 'warning' },
      { id: 'notif_004', type: 'action', message: '2 pending pull requests require review', timestamp: '2026-05-23T22:00:00Z', severity: 'info' },
    ],
  },
};

export const analysisData = {
  objectDetection: {
    objects: [
      { label: 'person', confidence: 0.97, boundingBox: { x: 120, y: 80, w: 200, h: 400 } },
      { label: 'car', confidence: 0.94, boundingBox: { x: 300, y: 200, w: 350, h: 180 } },
      { label: 'dog', confidence: 0.89, boundingBox: { x: 50, y: 350, w: 150, h: 120 } },
      { label: 'bicycle', confidence: 0.76, boundingBox: { x: 500, y: 300, w: 280, h: 200 } },
    ],
    totalObjectsDetected: 4,
    processingTimeMs: 234,
  },
  textExtraction: {
    raw: 'The quick brown fox jumps over the lazy dog. This image contains various elements including people, vehicles, and animals in an urban setting.',
    confidence: 0.92,
    words: [
      { text: 'The', confidence: 0.99, bbox: [10, 5, 40, 25] },
      { text: 'quick', confidence: 0.98, bbox: [45, 5, 95, 25] },
      { text: 'brown', confidence: 0.97, bbox: [100, 5, 155, 25] },
    ],
    language: 'en',
    processingTimeMs: 156,
  },
  colorAnalysis: {
    dominantColors: [
      { hex: '#2C3E50', name: 'Midnight Blue', percentage: 35 },
      { hex: '#E74C3C', name: 'Alizarin', percentage: 22 },
      { hex: '#ECF0F1', name: 'Cloud White', percentage: 18 },
      { hex: '#3498DB', name: 'Peter River', percentage: 15 },
      { hex: '#F39C12', name: 'Sun Flower', percentage: 10 },
    ],
    averageBrightness: 42,
    isDark: true,
    colorPalette: ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB', '#F39C12'],
    processingTimeMs: 89,
  },
  qualityCheck: {
    overall: 7.8,
    sharpness: 8.2,
    noise: 7.5,
    exposure: 6.9,
    contrast: 8.1,
    recommendations: [
      'Increase exposure slightly in shadow areas',
      'Reduce noise in the upper-right quadrant',
    ],
    isPass: true,
    processingTimeMs: 312,
  },
};
