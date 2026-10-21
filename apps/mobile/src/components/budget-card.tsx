import { useState } from 'react';

import { StyleSheet, Text, TextInput, View } from 'react-native';

import { parseAmount } from '@ledgerflow/core';
import { Button, fonts, fontSize, palette, spacing } from '@ledgerflow/ui';

import { useLedgerStore } from '@/state/ledger-store';

function toInput(cents: number): string {
  return cents === 0 ? '' : String(cents / 100);
}

export function BudgetCard() {
  const period = useLedgerStore((state) => state.period);
  const budgetCents = useLedgerStore((state) => state.budgetCents);
  const saveBudget = useLedgerStore((state) => state.saveBudget);
  const [raw, setRaw] = useState(() => toInput(budgetCents));
  const [savedCents, setSavedCents] = useState(budgetCents);

  if (budgetCents !== savedCents) {
    setSavedCents(budgetCents);
    setRaw(toInput(budgetCents));
  }

  function commit() {
    void saveBudget(parseAmount(raw === '' ? '0' : raw).amountCents);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Monthly budget</Text>
        <Text style={styles.period}>{period}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.currency}>¥</Text>
        <TextInput
          value={raw}
          onChangeText={setRaw}
          placeholder="0"
          placeholderTextColor={palette.inkSoft}
          keyboardType="decimal-pad"
          accessibilityLabel="Monthly budget"
          maxLength={12}
          style={styles.input}
        />
        <Button label="Save" tone="teal" size="md" onPress={commit} style={styles.save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: palette.inkMuted,
  },
  period: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currency: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.inkMuted,
  },
  input: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 12,
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  save: {
    height: 44,
    flexShrink: 0,
    paddingHorizontal: spacing.md,
  },
});
