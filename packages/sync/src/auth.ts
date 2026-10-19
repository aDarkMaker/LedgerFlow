import { supabase } from './supabase';

export type AuthState = {
  readonly userId: string | null;
  readonly email: string | null;
};

export async function signInWithOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error !== null) {
    throw error;
  }
}

export async function verifyOtp(email: string, token: string): Promise<AuthState> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error !== null) {
    throw error;
  }
  return { userId: data.user?.id ?? null, email: data.user?.email ?? null };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error !== null) {
    throw error;
  }
}

export async function currentSession(): Promise<AuthState> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return { userId: user?.id ?? null, email: user?.email ?? null };
}
