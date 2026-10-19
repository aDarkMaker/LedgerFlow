import { createClient } from '@supabase/supabase-js';

export type SyncConfig = {
  readonly url: string;
  readonly anonKey: string;
};

export type SyncTable = 'categories' | 'entries' | 'budgets' | 'profiles';

/** Concrete client shape so wrappers keep the generated database typings. */
export type SyncClient = ReturnType<typeof createClient>;

/** Service role credentials must never reach the client bundle. */
export function createSyncClient(config: SyncConfig): SyncClient {
  if (config.url === '' || config.anonKey === '') {
    throw new Error('Supabase url and anon key are required');
  }
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
