import { describe, expect, it, vi } from 'vitest';

import { createSyncEngine } from '../src/engine';
import { backoffDelayMs, isRetryable, shouldApplyRemote, type OutboxItem } from '../src/types';

function item(id: string, attempts = 0): OutboxItem {
  return {
    id,
    entity: 'entries',
    entityId: `entry-${id}`,
    operation: 'upsert',
    payload: '{}',
    attempts,
    createdAt: '2026-10-19T10:00:00.000Z',
  };
}

describe('sync engine', () => {
  it('pushes pending items then pulls with the given cursor', async () => {
    const ack = vi.fn();
    const fail = vi.fn();
    const push = vi.fn();
    const pull = vi.fn().mockResolvedValue(3);

    const engine = createSyncEngine({
      outbox: {
        pending: vi.fn().mockResolvedValue([item('a'), item('b')]),
        ack,
        fail,
      },
      remote: { push, pull },
    });

    const result = await engine.run({ since: '2026-10-18T00:00:00.000Z' });

    expect(push).toHaveBeenCalledTimes(2);
    expect(ack).toHaveBeenCalledWith(['a', 'b']);
    expect(pull).toHaveBeenCalledWith('2026-10-18T00:00:00.000Z');
    expect(result).toEqual({ pushed: 2, pulled: 3, failed: [] });
    expect(fail).not.toHaveBeenCalled();
  });

  it('records failures without blocking other items', async () => {
    const ack = vi.fn();
    const fail = vi.fn();
    const push = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(undefined);

    const engine = createSyncEngine({
      outbox: { pending: vi.fn().mockResolvedValue([item('a'), item('b')]), ack, fail },
      remote: { push, pull: vi.fn().mockResolvedValue(0) },
    });

    const result = await engine.run();

    expect(ack).toHaveBeenCalledWith(['b']);
    expect(fail).toHaveBeenCalledWith('a', 'network down');
    expect(result.failed).toEqual([{ id: 'a', error: 'network down' }]);
  });

  it('reports the pending backlog', async () => {
    const engine = createSyncEngine({
      outbox: {
        pending: vi.fn().mockResolvedValue([item('a'), item('b'), item('c')]),
        ack: vi.fn(),
        fail: vi.fn(),
      },
      remote: { push: vi.fn(), pull: vi.fn() },
    });

    await expect(engine.pendingCount()).resolves.toBe(3);
  });
});

describe('sync policy', () => {
  it('applies remote rows when they are newer', () => {
    expect(shouldApplyRemote(null, '2026-10-19T10:00:00.000Z')).toBe(true);
    expect(shouldApplyRemote('2026-10-19T09:00:00.000Z', '2026-10-19T10:00:00.000Z')).toBe(true);
    expect(shouldApplyRemote('2026-10-19T10:00:00.000Z', '2026-10-19T10:00:00.000Z')).toBe(false);
    expect(shouldApplyRemote('2026-10-19T11:00:00.000Z', '2026-10-19T10:00:00.000Z')).toBe(false);
  });

  it('retries only transient failures', () => {
    expect(isRetryable(undefined)).toBe(true);
    expect(isRetryable(429)).toBe(true);
    expect(isRetryable(503)).toBe(true);
    expect(isRetryable(404)).toBe(false);
  });

  it('caps exponential backoff', () => {
    expect(backoffDelayMs(0)).toBe(500);
    expect(backoffDelayMs(3)).toBe(4000);
    expect(backoffDelayMs(20)).toBe(30_000);
  });
});
