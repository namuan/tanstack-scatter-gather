import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { ScatterGatherOptions, WorkerResult } from './types';

export function useParallelScatterGather<T, R>(
  options: ScatterGatherOptions<T, R> & { input: T; batchSize?: number }
) {
  const { workers, input, batchSize = 5, ...rest } = options;

  const workerIds = Object.keys(workers);

  const batches = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < workerIds.length; i += batchSize) {
      result.push(workerIds.slice(i, i + batchSize));
    }
    return result;
  }, [workerIds, batchSize]);

  const queryResults = useQueries({
    queries: workerIds.map(workerId => {
      const workerFn = workers[workerId];
      return {
        queryKey: ['scatter', workerId, input],
        queryFn: async () => {
          const result = await workerFn(input);
          return { workerId, result } satisfies WorkerResult<R>;
        },
        ...rest,
      };
    }),
  });

  const progressiveResults = useMemo(() => {
    const results = new Map<string, R>();
    const failed = new Map<string, Error>();

    queryResults.forEach((query, index) => {
      const workerId = workerIds[index];
      if (query.isSuccess && query.data) {
        results.set(workerId, query.data.result);
      } else if (query.isError && query.error) {
        failed.set(workerId, query.error as Error);
      }
    });

    return { results, failed };
  }, [queryResults, workerIds]);

  const completedCount = queryResults.filter(q => q.isSuccess || q.isError).length;
  const totalCount = workerIds.length;

  return {
    ...progressiveResults,
    batches,
    progress: totalCount > 0 ? completedCount / totalCount : 0,
    isComplete: completedCount === totalCount,
    isPartial: completedCount > 0 && completedCount < totalCount,
  };
}
