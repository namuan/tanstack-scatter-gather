import type { IncomingMessage, ServerResponse } from 'node:http';
import { searchResults, dashboardData, analysisData } from './data.js';

const MOCK_DELAY_MS = 800;
const MOCK_ERROR_RATE = 0;

interface HandlerContext {
  defaultDelay: number;
  defaultErrorRate: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function maybeError(errorRate: number): void {
  if (Math.random() < errorRate) {
    throw new Error('Simulated server error');
  }
}

function parseQuery(url: string | undefined): URLSearchParams {
  return new URLSearchParams((url ?? '').split('?')[1] ?? '');
}

function sendJson(res: ServerResponse, data: unknown, statusCode = 200): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, statusCode: number, message: string): void {
  sendJson(res, { error: message }, statusCode);
}

export function handleSearch(ctx: HandlerContext) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const params = parseQuery(req.url);
    const source = req.url?.match(/\/api\/search\/(\w+)/)?.[1] ?? 'google';
    const delay = Number(params.get('_delay')) || ctx.defaultDelay;
    const errorRate = Number(params.get('_error')) ?? ctx.defaultErrorRate;

    await sleep(delay);
    try {
      maybeError(errorRate);
    } catch {
      sendError(res, 500, `Search source ${source} unavailable`);
      return;
    }

    const data = searchResults[source as keyof typeof searchResults] ?? searchResults.google;
    const query = params.get('q') ?? '';
    const filtered = data.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.snippet.toLowerCase().includes(query.toLowerCase())
    );

    sendJson(res, {
      source,
      query,
      results: filtered,
      totalResults: filtered.length,
      fetchedAt: new Date().toISOString(),
    });
  };
}

export function handleDashboard(ctx: HandlerContext) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const params = parseQuery(req.url);
    const delay = Number(params.get('_delay')) || ctx.defaultDelay;
    const errorRate = Number(params.get('_error')) ?? ctx.defaultErrorRate;

    await sleep(delay);
    try {
      maybeError(errorRate);
    } catch {
      sendError(res, 500, 'Analytics service unavailable');
      return;
    }

    sendJson(res, dashboardData.analytics);
  };
}

export function handleUserData(ctx: HandlerContext) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const params = parseQuery(req.url);
    const delay = Number(params.get('_delay')) || ctx.defaultDelay;
    const errorRate = Number(params.get('_error')) ?? ctx.defaultErrorRate;

    await sleep(delay);
    try {
      maybeError(errorRate);
    } catch {
      sendError(res, 500, 'User service unavailable');
      return;
    }

    sendJson(res, dashboardData.userData);
  };
}

export function handleNotifications(ctx: HandlerContext) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const params = parseQuery(req.url);
    const delay = Number(params.get('_delay')) || ctx.defaultDelay;
    const errorRate = Number(params.get('_error')) ?? ctx.defaultErrorRate;

    await sleep(delay);
    try {
      maybeError(errorRate);
    } catch {
      sendError(res, 500, 'Notifications service unavailable');
      return;
    }

    sendJson(res, dashboardData.notifications);
  };
}

const ENDPOINT_TO_KEY: Record<string, keyof typeof analysisData> = {
  'detect-objects': 'objectDetection',
  'extract-text': 'textExtraction',
  'colors': 'colorAnalysis',
  'color-analysis': 'colorAnalysis',
  'quality': 'qualityCheck',
  'quality-check': 'qualityCheck',
};

export function handleAnalyze(ctx: HandlerContext) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const params = parseQuery(req.url);
    const endpoint = req.url?.match(/\/api\/analyze\/([\w-]+)/)?.[1] ?? 'detect-objects';
    const delay = Number(params.get('_delay')) || ctx.defaultDelay;
    const errorRate = Number(params.get('_error')) ?? ctx.defaultErrorRate;

    await sleep(delay);
    try {
      maybeError(errorRate);
    } catch {
      sendError(res, 500, `Analysis endpoint ${endpoint} unavailable`);
      return;
    }

    const key = ENDPOINT_TO_KEY[endpoint] ?? 'objectDetection';
    sendJson(res, analysisData[key]);
  };
}

export function handleOptions(res: ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end();
}

export function notFound(res: ServerResponse): void {
  sendError(res, 404, 'Not found');
}
