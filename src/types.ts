export interface ScatterGatherOptions<T, R> {
  workers: Record<string, (input: T) => Promise<R>>;
  timeout?: number;
  retryAttempts?: number;
  strategy?: 'all' | 'majority' | 'first';
  minSuccessCount?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export interface ScatterGatherMetadata {
  totalWorkers: number;
  successfulWorkers: number;
  failedWorkers: number;
  totalTime: number;
}

export interface ScatterGatherResult<R> {
  results: Map<string, R>;
  failed: Map<string, Error>;
  metadata: ScatterGatherMetadata;
}

export type ScatterGatherStatus = 'pending' | 'success' | 'error';

export interface WorkerResult<R> {
  workerId: string;
  result: R;
}
