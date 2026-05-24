import { createServer, type Server } from 'node:http';
import { handleSearch, handleDashboard, handleUserData, handleNotifications, handleAnalyze, handleOptions, notFound } from './handlers.js';

export interface MockServerConfig {
  port?: number;
  defaultDelay?: number;
  defaultErrorRate?: number;
}

export function createMockServer(config: MockServerConfig = {}): Server {
  const port = config.port ?? 4000;
  const defaultDelay = config.defaultDelay ?? 800;
  const defaultErrorRate = config.defaultErrorRate ?? 0;

  const ctx = { defaultDelay, defaultErrorRate };

  const server = createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      handleOptions(res);
      return;
    }

    const url = req.url ?? '';

    if (url.startsWith('/api/search/')) {
      handleSearch(ctx)(req, res);
    } else if (url.startsWith('/api/analytics/dashboard')) {
      handleDashboard(ctx)(req, res);
    } else if (url.startsWith('/api/users/current')) {
      handleUserData(ctx)(req, res);
    } else if (url.startsWith('/api/notifications/unread')) {
      handleNotifications(ctx)(req, res);
    } else if (url.startsWith('/api/analyze/')) {
      handleAnalyze(ctx)(req, res);
    } else {
      notFound(res);
    }
  });

  server.listen(port, () => {
    console.log(`Mock scatter-gather server running at http://localhost:${port}`);
    console.log(`  Default delay: ${defaultDelay}ms`);
    console.log(`  Default error rate: ${defaultErrorRate * 100}%`);
    console.log('');
    console.log('  Endpoints:');
    console.log('    GET  /api/search/:source?q=<term>&_delay=500&_error=0.2');
    console.log('    GET  /api/analytics/dashboard');
    console.log('    GET  /api/users/current');
    console.log('    GET  /api/notifications/unread');
    console.log('    POST /api/analyze/:endpoint');
    console.log('');
    console.log('  Per-request overrides via query params:');
    console.log('    _delay=<ms>  _error=<rate>');
  });

  return server;
}

const isMainModule = process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js');
if (isMainModule) {
  const port = Number(process.env.PORT) || 4000;
  const defaultDelay = Number(process.env.DELAY) || 800;
  const defaultErrorRate = Number(process.env.ERROR_RATE) || 0;
  createMockServer({ port, defaultDelay, defaultErrorRate });
}
