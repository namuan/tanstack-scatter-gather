import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useScatterGather } from './useScatterGather';
import type { ScatterGatherOptions } from './types';

export function useCachedScatterGather<T, R>(
  options: ScatterGatherOptions<T, R> & { input: T }
) {
  const queryClient = useQueryClient();
  const result = useScatterGather(options);

  useEffect(() => {
    if (result.isSuccess) {
      result.results.forEach((workerResult, workerId) => {
        queryClient.setQueryData(
          [`worker-${workerId}`, options.input],
          workerResult
        );
      });
    }
  }, [result.results, result.isSuccess, options.input, queryClient]);

  return result;
}
