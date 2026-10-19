import { useEffect, useMemo, useState } from 'react';

import NetInfo from '@react-native-community/netinfo';

import { getDatabase } from '@/lib/database';

import { useLedgerStore } from './ledger-store';

export type SyncStatus = {
  readonly online: boolean;
};

/** Syncs on foreground and on reconnect; failures stay silent by design. */
export function useSyncStatus(): SyncStatus {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const reachable = state.isConnected !== false && state.isInternetReachable !== false;
      setOnline(reachable);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!online) {
      return;
    }
    void useLedgerStore.getState().flushOutbox();
  }, [online]);

  return { online };
}

export function usePendingCount(): number {
  const pending = useLedgerStore((state) => state.pendingCount);
  const refresh = useLedgerStore((state) => state.refreshPending);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return pending;
}

export function useDb() {
  return useMemo(() => getDatabase().db, []);
}
