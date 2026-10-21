import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney, money, type Category, type Entry } from '@ledgerflow/core';
import { fonts, fontSize, palette, spacing } from '@ledgerflow/ui';

import { CategoryIcon } from '@/components/category-icon';

type Props = {
  entry: Entry;
  category: Category | undefined;
  onLongPress?: (entry: Entry) => void;
};

export function EntryRow({ entry, category, onLongPress }: Props) {
  const accent = category?.color ?? palette.inkSoft;
  const sign = entry.kind === 'expense' ? '-' : '+';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category?.name ?? 'Entry'} ${formatMoney(money(entry.amountCents))}`}
      accessibilityHint="Long press to delete"
      onLongPress={() => onLongPress?.(entry)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.swatch, { backgroundColor: accent }]}>
        <CategoryIcon id={category?.id ?? ''} size={18} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {category?.name ?? 'Uncategorised'}
        </Text>
        <Text style={styles.note} numberOfLines={1}>
          {entry.note === '' ? entry.occurredOn : entry.note}
        </Text>
      </View>
      <Text style={[styles.amount, entry.kind === 'income' && styles.income]} numberOfLines={1}>
        {sign}
        {formatMoney(money(entry.amountCents), { withSymbol: false })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: palette.hairline,
  },
  pressed: {
    opacity: 0.6,
  },
  swatch: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.body,
    color: palette.ink,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  amount: {
    fontFamily: fonts.heading,
    fontSize: fontSize.body,
    color: palette.ink,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right',
  },
  income: {
    color: palette.teal,
  },
});
