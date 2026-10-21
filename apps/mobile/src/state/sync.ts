import { useSyncExternalStore } from 'react';

import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import { useLedgerStore } from './ledger-store';

export type SyncStatus = {
  readonly online: boolean;
};

/**
 * Connectivity is process-wide, so the listener is created once and shared by
 * every screen instead of once per hook call.
 */
let online = true;
let started = false;
let initialSyncDone = false;
let teardown: (() => void) | null = null;
const listeners = new Set<() => void>();

function drainOnce(): void {
  if (initialSyncDone) {
    return;
  }
  initialSyncDone = true;
  void useLedgerStore.getState().flushOutbox();
}

function publish(next: boolean) {
  if (online === next) {
    return;
  }
  online = next;
  for (const listener of listeners) {
    listener();
  }
  if (next) {
    void useLedgerStore.getState().flushOutbox();
  }
}

function start(): void {
  if (started) {
    return;
  }
  started = true;
  drainOnce();

  if (Platform.OS === 'web') {
    const browser = globalThis as unknown as {
      navigator: { onLine: boolean };
      addEventListener(type: 'online' | 'offline', listener: () => void): void;
      removeEventListener(type: 'online' | 'offline', listener: () => void): void;
    };
    const update = () => publish(browser.navigator.onLine);
    update();
    browser.addEventListener('online', update);
    browser.addEventListener('offline', update);
    teardown = () => {
      browser.removeEventListener('online', update);
      browser.removeEventListener('offline', update);
    };
    return;
  }

  const unsubscribe = NetInfo.addEventListener((state) => {
    publish(state.isConnected !== false && state.isInternetReachable !== false);
  });
  teardown = () => {
    unsubscribe();
  };
}

function subscribe(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      teardown?.();
      teardown = null;
      started = false;
    }
  };
}

function snapshot(): boolean {
  return online;
}

/** Syncs on reconnect; failures stay silent by design. */
export function useSyncStatus(): SyncStatus {
  const reachable = useSyncExternalStore(subscribe, snapshot, snapshot);
  return { online: reachable };
}

export function usePendingCount(): number {
  return useLedgerStore((state) => state.pendingCount);
}
