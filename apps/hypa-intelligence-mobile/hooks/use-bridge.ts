import { useQuery } from '@tanstack/react-query';

import { getBridgeNumber, getBridgeThread, getBridgeThreads } from '@/api/bridge';
import { useUser } from '@/lib/user-provider';

/** Customers write at any time, so the open screens look again every 15 seconds. */
const REFRESH_MS = 15_000;

export const bridgeKeys = {
  number: ['bridge', 'number'] as const,
  threads: ['bridge', 'threads'] as const,
  thread: (id: string) => ['bridge', 'thread', id] as const,
};

export function useBridgeNumber() {
  const { user } = useUser();
  return useQuery({ queryKey: bridgeKeys.number, queryFn: getBridgeNumber, enabled: !!user?.id });
}

export function useBridgeThreads(enabled: boolean) {
  return useQuery({ queryKey: bridgeKeys.threads, queryFn: getBridgeThreads, enabled, refetchInterval: REFRESH_MS });
}

export function useBridgeThread(id: string | undefined) {
  return useQuery({
    queryKey: bridgeKeys.thread(id ?? ''),
    queryFn: () => getBridgeThread(id as string),
    enabled: !!id,
    refetchInterval: REFRESH_MS,
  });
}
