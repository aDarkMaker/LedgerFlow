import type { OutboxItem, SyncEntity } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

type RemoteOptions = {
  client: SupabaseClient;
  userId: () => string | null;
  tables?: readonly SyncEntity[];
};

export type RemoteGateway = {
  push: (item: OutboxItem) => Promise<void>;
  pull: (since: string | null) => Promise<number>;
};

const ENTITY_TABLES: Record<SyncEntity, string> = {
  categories: 'categories',
  entries: 'entries',
  budgets: 'budgets',
  profiles: 'profiles',
};

/** The gateway is intentionally dumb: RLS enforces ownership on the server. */
export function createRemoteGateway({
  client,
  userId,
  tables = ['categories', 'entries', 'budgets', 'profiles'],
}: RemoteOptions): RemoteGateway {
  return {
    async push(item) {
      const owner = userId();
      if (owner === null) {
        throw new Error('Not signed in');
      }
      const table = ENTITY_TABLES[item.entity];
      const payload = JSON.parse(item.payload) as Record<string, unknown>;
      const row = { ...payload, user_id: owner };

      if (item.operation === 'delete') {
        const { error } = await client
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', item.entityId)
          .eq('user_id', owner);
        if (error !== null) {
          throw error;
        }
        return;
      }

      const { error } = await client.from(table).upsert(row, { onConflict: 'id' });
      if (error !== null) {
        throw error;
      }
    },

    async pull(since) {
      const owner = userId();
      if (owner === null) {
        return 0;
      }

      let applied = 0;
      for (const entity of tables) {
        const table = ENTITY_TABLES[entity];
        let query = client.from(table).select('*').eq('user_id', owner);
        if (since !== null) {
          query = query.gt('updated_at', since);
        }
        const { data, error } = await query;
        if (error !== null) {
          throw error;
        }
        applied += data.length;
      }
      return applied;
    },
  };
}
