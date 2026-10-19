import { useEffect, useState } from 'react';

import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { csvFileName, entriesToCsv } from '@ledgerflow/core';
import { signInWithOtp, verifyOtp } from '@ledgerflow/sync';
import { Button, Card, fonts, fontSize, Icon, palette, spacing } from '@ledgerflow/ui';

import { ScreenHeader } from '@/components/screen-header';
import { shareCsv } from '@/lib/export';
import { useLedgerStore } from '@/state/ledger-store';
import { usePendingCount, useSyncStatus } from '@/state/sync';

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const { online } = useSyncStatus();
  const pendingCount = usePendingCount();
  const entries = useLedgerStore((state) => state.entries);
  const categories = useLedgerStore((state) => state.categories);
  const flushOutbox = useLedgerStore((state) => state.flushOutbox);

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void flushOutbox();
  }, [flushOutbox]);

  async function sendCode() {
    try {
      await signInWithOtp(email.trim());
      setStage('code');
      setMessage('Check your inbox for the six digit code.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the code');
    }
  }

  async function confirmCode() {
    try {
      await verifyOtp(email.trim(), token.trim());
      setMessage('Signed in. Pending changes will sync shortly.');
      await flushOutbox();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid code');
    }
  }

  async function exportCsv() {
    const csv = entriesToCsv(entries, categories);
    const period = entries[0]?.occurredOn.slice(0, 7) ?? 'export';
    try {
      await shareCsv(csvFileName(period), csv);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export failed');
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Settings"
          title="Your ledger"
          offline={!online}
          pendingCount={pendingCount}
        />

        <Card tone="surface" style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="user" size={18} color={palette.ink} />
            <Text style={styles.cardTitle}>Account</Text>
          </View>
          {stage === 'email' ? (
            <>
              <TextInput
                value={email}
                onChangeText={setEmail}
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
          {message === null ? null : <Text style={styles.message}>{message}</Text>}
        </Card>

        <Card tone="surface" style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="sliders-horizontal" size={18} color={palette.ink} />
            <Text style={styles.cardTitle}>Budget & data</Text>
          </View>
          <Button label="Edit monthly budget" tone="gold" onPress={() => router.push('/budget')} />
          <Button label="Export CSV" tone="ghost" onPress={() => void exportCsv()} />
        </Card>

        <Card tone="muted" style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="cloud-upload" size={18} color={palette.ink} />
            <Text style={styles.cardTitle}>Sync</Text>
          </View>
          <Text style={styles.body}>
            {pendingCount === 0
              ? 'Everything is on the server.'
              : `${pendingCount} change(s) waiting for the next sync.`}
          </Text>
          <Button label="Sync now" tone="coral" onPress={() => void flushOutbox()} />
        </Card>

        <Text style={styles.version}>LedgerFlow 0.1.0 · local first</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
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
  body: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  version: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: palette.inkSoft,
  },
});
