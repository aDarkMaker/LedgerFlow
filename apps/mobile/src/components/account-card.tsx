import { useEffect, useState } from 'react';

import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  currentSession,
  isSupabaseConfigured,
  signInWithOtp,
  signOut,
  verifyOtp,
  type AuthState,
} from '@ledgerflow/sync';
import { Button, Card, fonts, fontSize, Icon, palette, spacing } from '@ledgerflow/ui';

import { mediaUri, persistImage, pickImage } from '@/lib/media';
import { useLedgerStore } from '@/state/ledger-store';

const AVATAR_SIZE = 56;
const AVATAR_FILE = 'avatar.jpg';

export function AccountCard() {
  const profile = useLedgerStore((state) => state.profile);
  const updateProfile = useLedgerStore((state) => state.updateProfile);
  const flushOutbox = useLedgerStore((state) => state.flushOutbox);

  const [editing, setEditing] = useState<'name' | 'email' | null>(null);
  const [draft, setDraft] = useState('');
  const [auth, setAuth] = useState<AuthState>({ userId: null, email: null });
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }
    void currentSession().then((next) => {
      setAuth(next);
    });
  }, []);

  const signedIn = auth.userId !== null;
  const storedEmail = profile.email?.trim() ?? '';
  const email = storedEmail === '' ? (auth.email ?? null) : storedEmail;
  const storedName = profile.displayName?.trim() ?? '';
  const name = storedName === '' ? (email?.split('@')[0] ?? 'Guest') : storedName;
  const avatar = mediaUri(profile.avatarFileName);
  const initial = name.trim().charAt(0).toUpperCase() || 'L';

  async function changeAvatar() {
    try {
      const picked = await pickImage([1, 1]);
      if (picked === null) {
        return;
      }
      await updateProfile({ avatarFileName: await persistImage(picked, AVATAR_FILE) });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load that photo');
    }
  }

  function begin(field: 'name' | 'email', value: string) {
    setDraft(value);
    setEditing(field);
  }

  function commit() {
    if (editing === null) {
      return;
    }
    const trimmed = draft.trim();
    void updateProfile(editing === 'name' ? { displayName: trimmed } : { email: trimmed });
    setEditing(null);
  }

  async function sendCode() {
    try {
      await signInWithOtp(loginEmail.trim());
      setStage('code');
      setMessage('Check your inbox for the six digit code.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the code');
    }
  }

  async function confirmCode() {
    try {
      const next = await verifyOtp(loginEmail.trim(), token.trim());
      setAuth(next);
      await updateProfile({ email: next.email });
      setLoginOpen(false);
      setMessage('Signed in. Pending changes will sync shortly.');
      await flushOutbox();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid code');
    }
  }

  async function leave() {
    try {
      await signOut();
    } finally {
      setAuth({ userId: null, email: null });
      setMessage('Signed out. Entries stay on this device.');
    }
  }

  return (
    <Card tone="surface" style={styles.card}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change avatar"
          onPress={() => void changeAvatar()}
          style={styles.avatar}
        >
          {avatar === null ? (
            <Text style={styles.initial}>{initial}</Text>
          ) : (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          )}
        </Pressable>

        <View style={styles.copy}>
          {editing === 'name' ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              onBlur={commit}
              onSubmitEditing={commit}
              returnKeyType="done"
              maxLength={24}
              style={styles.inlineInput}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Name: ${name}. Tap to edit`}
              onPress={() => begin('name', name)}
            >
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          )}

          {editing === 'email' ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              onBlur={commit}
              onSubmitEditing={commit}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              style={[styles.inlineInput, styles.emailInput]}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Email: ${email ?? 'none'}. Tap to edit`}
              onPress={() => begin('email', email ?? '')}
            >
              <Text style={styles.email} numberOfLines={1}>
                {email ?? 'Local only'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.status, signedIn && styles.statusActive]}>
          <Text style={styles.statusText}>{signedIn ? 'Synced' : 'Local'}</Text>
        </View>
      </View>

      {!isSupabaseConfigured ? (
        <Text style={styles.message}>Cloud sync is not configured in this build.</Text>
      ) : signedIn ? (
        <Button label="Sign out" tone="ghost" onPress={() => void leave()} />
      ) : loginOpen ? (
        <View style={styles.login}>
          {stage === 'email' ? (
            <>
              <TextInput
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="you@example.com"
                placeholderTextColor={palette.inkSoft}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <Button label="Send login code" tone="ink" onPress={() => void sendCode()} />
            </>
          ) : (
            <>
              <TextInput
                value={token}
                onChangeText={setToken}
                placeholder="123456"
                placeholderTextColor={palette.inkSoft}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
              <Button label="Verify" tone="teal" onPress={() => void confirmCode()} />
            </>
          )}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enable cloud sync"
          onPress={() => setLoginOpen(true)}
          style={styles.syncRow}
        >
          <Icon name="cloud-upload" size={15} color={palette.inkMuted} />
          <Text style={styles.syncLabel}>Enable cloud sync</Text>
        </Pressable>
      )}

      {message === null ? null : <Text style={styles.message}>{message}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: palette.gold,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    color: palette.ink,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  inlineInput: {
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: palette.ink,
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  emailInput: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
  },
  status: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 999,
  },
  statusActive: {
    backgroundColor: palette.teal,
  },
  statusText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    color: palette.ink,
  },
  login: {
    gap: spacing.sm,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  syncLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 14,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: palette.ink,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
});
