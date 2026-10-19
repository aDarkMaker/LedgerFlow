import { createSyncClient } from './client';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = url !== '' && anonKey !== '';

const client = createSyncClient({
  url: url === '' ? 'http://localhost' : url,
  anonKey: anonKey === '' ? 'public-anon-key' : anonKey,
});

export { client as supabase };
