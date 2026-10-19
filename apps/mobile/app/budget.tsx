import { useState } from 'react';

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseAmount } from '@ledgerflow/core';
import { Button, Card, fonts, fontSize, Icon, palette, spacing } from '@ledgerflow/ui';

import { useLedgerStore } from '@/state/ledger-store';

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const saveBudget = useLedgerStore((state) => state.saveBudget);
  const currentBudget = useLedgerStore((state) => state.budgetCents);
  const period = useLedgerStore((state) => state.period);
  const [raw, setRaw] = useState(currentBudget === 0 ? '' : String(currentBudget / 100));

  const parsed = parseAmount(raw === '' ? '0' : raw);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          style={styles.close}
        >
          <Icon name="x" size={18} color={palette.ink} />
        </Pressable>
        <Text style={styles.title}>Monthly budget</Text>
      </View>

      <Card tone="surface" style={styles.card}>
        <Text style={styles.label}>{period}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>¥</Text>
          <TextInput
            value={raw}
            onChangeText={setRaw}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>
        <Text style={styles.hint}>
          The remaining amount is spread across the days left in this month.
        </Text>
      </Card>

      <Button
        label="Save budget"
        tone="teal"
        size="lg"
        fullWidth
        onPress={() => {
          void saveBudget(parsed.amountCents).then(() => router.back());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: palette.canvas,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  close: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 999,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h1,
    color: palette.ink,
  },
  card: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.inkMuted,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currency: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.inkMuted,
  },
  input: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 38,
    color: palette.ink,
    padding: 0,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
});
