export type SyncEntity = 'categories' | 'entries' | 'budgets' | 'profiles';
export type SyncOperation = 'upsert' | 'delete';

export type OutboxItem = {
  readonly id: string;
  readonly entity: SyncEntity;
  readonly entityId: string;
  readonly operation: SyncOperation;
  readonly payload: string;
  readonly attempts: number;
  readonly createdAt: string;
};

export type SyncResult = {
  readonly pushed: number;
  readonly pulled: number;
  readonly failed: readonly { id: string; error: string }[];
};

export type RemoteRecord = {
  readonly id: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
  readonly [key: string]: unknown;
};

/**
 * Last write wins is safe here because every mutation carries a monotonic
 * client timestamp and tombstones keep deletions observable.
 */
export function shouldApplyRemote(localUpdatedAt: string | null, remoteUpdatedAt: string): boolean {
  if (localUpdatedAt === null) {
    return true;
  }
  return remoteUpdatedAt > localUpdatedAt;
}

/** Retry only transient failures; permanent ones should not spin forever. */
export function isRetryable(status: number | undefined): boolean {
  if (status === undefined) {
    return true;
  }
  return status === 429 || status >= 500;
}

export function backoffDelayMs(attempts: number): number {
  const base = 500;
  return Math.min(30_000, base * 2 ** Math.max(0, attempts));
}
