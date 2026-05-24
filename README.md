# TanStack Scatter-Gather

Scatter-Gather pattern implementation using [TanStack Query](https://tanstack.com/query) (React Query v5). Fire parallel operations across multiple workers, collect results, and apply configurable completion strategies.

## Installation

```bash
npm install @tanstack/react-query
```

## Hooks

### `useScatterGather`

Core hook — fires all workers in parallel, consolidates results.

```tsx
import { useScatterGather } from './useScatterGather';

const workers = {
  api1: async (input: string) => { const r = await fetch(`/api1?q=${input}`); return r.json(); },
  api2: async (input: string) => { const r = await fetch(`/api2?q=${input}`); return r.json(); },
};

const { data, results, failed, metadata, status, isPending, isSuccess, isError, refetch } =
  useScatterGather({
    workers,
    input: 'query',
    timeout: 5000,
    retryAttempts: 2,
    strategy: 'majority',
    minSuccessCount: 2,
    enabled: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
```

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `workers` | `Record<string, (input: T) => Promise<R>>` | — | Map of worker name to async function |
| `input` | `T` | — | Input passed to each worker |
| `timeout` | `number` | `30000` | Per-worker timeout in ms |
| `retryAttempts` | `number` | `1` | Retry attempts per worker |
| `strategy` | `'all' \| 'majority' \| 'first'` | `'all'` | Completion strategy |
| `minSuccessCount` | `number` | `workers.length` | Minimum successes for `'all'` strategy |
| `enabled` | `boolean` | `true` | Enable/disable queries |
| `staleTime` | `number` | `0` | TanStack Query stale time |
| `gcTime` | `number` | `300000` | TanStack Query garbage collection time |

#### Return Value

| Field | Type | Description |
|---|---|---|
| `data` | `ScatterGatherResult<R> \| null` | Consolidated result if strategy satisfied |
| `results` | `Map<string, R>` | Successful worker outputs |
| `failed` | `Map<string, Error>` | Failed worker errors |
| `metadata` | `ScatterGatherMetadata` | Total/successful/failed counts + timing |
| `status` | `'pending' \| 'success' \| 'error'` | Combined status |
| `isPending` | `boolean` | Any worker still loading |
| `isSuccess` | `boolean` | Strategy requirements met |
| `isError` | `boolean` | Strategy requirements not met |
| `isLoading` | `boolean` | True if any worker is loading (first load) |
| `isFetching` | `boolean` | True if any worker is refetching |
| `refetch` | `() => void` | Refetch all workers |

### `useParallelScatterGather`

Variant that exposes progress tracking alongside batched execution.

```tsx
const { results, failed, progress, isComplete, isPartial } = useParallelScatterGather({
  workers,
  input: imageUrl,
  batchSize: 2,
  enabled: !!imageUrl,
});
```

### `useResilientScatterGather`

Wraps `useScatterGather` with automatic fallback — when a worker fails after retries, it retries once more with a fallback that first tries the original worker, then reads from the query cache.

```tsx
const { fallbackUsed, refetchWithFallback, ...rest } = useResilientScatterGather({
  workers,
  input: 'query',
});
```

### `useCachedScatterGather`

Wraps `useScatterGather` and caches each successful worker's result independently via `queryClient.setQueryData`, keyed by `['worker-<id>', input]`.

```tsx
const result = useCachedScatterGather({ workers, input: 'query' });
```

## Strategies

| Strategy | Condition |
|---|---|
| `'all'` | `results.size >= minSuccessCount` |
| `'majority'` | `results.size > totalWorkers / 2` |
| `'first'` | `results.size > 0` |

## Examples

- `src/examples/SearchAggregator.tsx` — multi-source search with majority strategy
- `src/examples/DashboardWidget.tsx` — dashboard loading from 4 sources with partial failure display
- `src/examples/ProgressiveImageAnalyzer.tsx` — image analysis with progress bar

## Full E2E Demo

Run the complete stack — mock backend + React frontend — to see the scatter-gather hooks in action against real HTTP endpoints.

### 1. Start the mock server (Terminal 1)

```bash
npm run mock-server
```

This starts an HTTP API at `http://localhost:4000` with simulated latency (configurable via `DELAY=800` and `ERROR_RATE=0`).

### 2. Start the dev client (Terminal 2)

```bash
npm run dev
```

This starts Vite at `http://localhost:5173` with a proxy that forwards `/api/*` to the mock server.

### 3. Open the demo

Navigate to **http://localhost:5173** in your browser. Three tabs let you switch between demo scenarios:

| Tab | Hook | Strategy | What it shows |
|---|---|---|---|
| **Search Aggregator** | `useScatterGather` | `majority` | Searches 3 sources (google, bing, duckduckgo); green if ≥ 2 respond |
| **Dashboard** | `useScatterGather` | `all` | Loads 4 widgets; shows partial failures inline |
| **Image Analyzer** | `useParallelScatterGather` | — | Runs 4 analyses with progress bar; `batchSize: 2` |

### 4. Experiment

Inject latency or failures per-request by appending query params to the mock server URLs:

```
/api/search/google?q=test&_delay=2000    # slow response
/api/search/bing?q=test&_error=0.8       # 80% chance of error
```

The demo also works with client-side mock workers (no server needed):

```tsx
const workers = {
  fast: async (input: string) => {
    await new Promise(r => setTimeout(r, 300));
    return { data: `result for ${input}` };
  },
  slow: async (input: string) => {
    await new Promise(r => setTimeout(r, 2000));
    return { data: `late result for ${input}` };
  },
  flaky: async (input: string) => {
    await new Promise(r => setTimeout(r, 500));
    if (Math.random() < 0.3) throw new Error('transient failure');
    return { data: `flaky result for ${input}` };
  },
};
```

## Mock Server

A fully functional mock HTTP server is included to run the examples end-to-end.

### Start

```bash
npm run mock-server
```

Starts on `http://localhost:4000`. Configure via environment variables:

| Env | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port |
| `DELAY` | `800` | Default latency per endpoint (ms) |
| `ERROR_RATE` | `0` | Default error rate (0.0 – 1.0) |

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/search/:source?q=<term>` | Search results from `google`, `bing`, or `duckduckgo` |
| `GET` | `/api/analytics/dashboard` | Dashboard analytics data |
| `GET` | `/api/users/current` | Current user profile |
| `GET` | `/api/notifications/unread` | Unread notifications |
| `POST` | `/api/analyze/:endpoint` | Image analysis (`detect-objects`, `extract-text`, `colors`, `quality`) |

All endpoints support per-request overrides via query params:
- `_delay=<ms>` — override latency for this request
- `_error=<rate>` — override error probability for this request (e.g. `_error=0.5`)

### Programmatic Usage

```ts
import { createMockServer } from './src/mock/index.js';

const server = createMockServer({ port: 4000, defaultDelay: 300, defaultErrorRate: 0.1 });
```

## E2E Tests

Playwright test suite covering all three demo scenarios and error handling.

### Run

```bash
npm run test:e2e
```

This starts the mock server and Vite dev server automatically, runs the tests headlessly, then shuts everything down.

### Test structure

| File | What it covers |
|---|---|
| `e2e/search-aggregator.spec.ts` | Loading state, multi-source results, result counts, error on insufficient sources, query length gating, refresh |
| `e2e/dashboard.spec.ts` | Loading state, all cards present, metadata counts, JSON data validity, refresh |
| `e2e/image-analyzer.spec.ts` | Input visibility, progress bar, all 4 analysis results, JSON data, progress percentage, input clearing |
| `e2e/error-handling.spec.ts` | Route interception for partial/total failures, retry buttons, tab stability after errors |

Tests use Playwright's `webServer` config to auto-manage the mock server and Vite dev server — no manual setup needed.

### Test files

```
e2e/
├── playwright.config.ts
├── search-aggregator.spec.ts
├── dashboard.spec.ts
├── image-analyzer.spec.ts
└── error-handling.spec.ts
```

### macOS troubleshooting

If you see `SEGV_ACCERR` or crashpad bootstrap errors on macOS, set the following environment variable before running:

```bash
CHROME_CRASHPAD_HANDLER_PID=0 npm run test:e2e
```

This disables Chromium's crash reporter, which is blocked by macOS sandbox restrictions on some configurations.

## Key Benefits

- **Parallel execution** via TanStack Query's `useQueries`
- **Per-worker timeout** via `Promise.race`
- **Exponential backoff retry** built into TanStack Query
- **Configurable strategies** for different reliability needs
- **Automatic caching** and deduplication
- **DevTools integration** — inspect scatter-gather queries in TanStack Query DevTools
