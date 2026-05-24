import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useScatterGather } from './useScatterGather';
import type { ScatterGatherOptions } from './types';

export function useResilientScatterGather<T, R>(
  options: ScatterGatherOptions<T, R> & { input: T }
) {
  const queryClient = useQueryClient();
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const result = useScatterGather({
    ...options,
    retryAttempts: 2,
  });

  useEffect(() => {
    if (result.isError && !fallbackUsed) {
      const cachedWorkers = Object.entries(options.workers).reduce((acc, [id, fn]) => {
        acc[`${id}_fallback`] = async (input: T) => {
          try {
            return await fn(input);
          } catch {
            const cached = queryClient.getQueryData<{ workerId: string; result: R }>(
              ['scatter-gather', id, input]
            );
            if (cached) return cached.result;
            throw new Error(`No fallback available for ${id}`);
          }
        };
        return acc;
      }, {} as Record<string, (input: T) => Promise<R>>);

      setFallbackUsed(true);
    }
  }, [result.isError, fallbackUsed, options.workers, options.input, queryClient]);

  const refetchWithFallback = useCallback(() => {
    setRetryKey(k => k + 1);
    setFallbackUsed(false);
  }, []);

  return {
    ...result,
    fallbackUsed,
    retryKey,
    refetchWithFallback,
  };
}
