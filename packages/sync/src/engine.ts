import { backoffDelayMs, isRetryable, type OutboxItem, type SyncResult } from './types';

export type OutboxPort = {
  pending: (limit: number) => Promise<OutboxItem[]>;
  ack: (ids: readonly string[]) => Promise<void>;
  fail: (id: string, error: string) => Promise<void>;
};

export type RemotePort = {
  push: (item: OutboxItem) => Promise<void>;
  pull: (since: string | null) => Promise<number>;
};

export type SyncEngineDeps = {
  outbox: OutboxPort;
  remote: RemotePort;
  batchSize?: number;
};

export type SyncEngine = {
  run: (options?: { since?: string | null }) => Promise<SyncResult>;
  pendingCount: () => Promise<number>;
};

/**
 * Pushes local changes before pulling so the remote cursor never skips
 * data that this device just created.
 */
export function createSyncEngine({ outbox, remote, batchSize = 50 }: SyncEngineDeps): SyncEngine {
  return {
    async run(options = {}) {
      const pending = await outbox.pending(batchSize);
      const pushed: string[] = [];
      const failed: { id: string; error: string }[] = [];

      for (const item of pending) {
        try {
          await remote.push(item);
          pushed.push(item.id);
        } catch (error) {
          failed.push({ id: item.id, error: toMessage(error) });
          await outbox.fail(item.id, toMessage(error));
        }
      }

      if (pushed.length > 0) {
        await outbox.ack(pushed);
      }

      const pulled = await remote.pull(options.since ?? null);

      return { pushed: pushed.length, pulled, failed };
    },

    async pendingCount() {
      const pending = await outbox.pending(Number.MAX_SAFE_INTEGER);
      return pending.length;
    },
  };
}

export function retryDelay(item: Pick<OutboxItem, 'attempts'>): number {
  return backoffDelayMs(item.attempts);
}

export { isRetryable };

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
