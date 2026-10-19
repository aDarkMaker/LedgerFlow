import { useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseAmount, todayIso, validateEntry } from '@ledgerflow/core';
import {
  Button,
  Card,
  Chip,
  fonts,
  fontSize,
  Icon,
  palette,
  radius,
  spacing,
} from '@ledgerflow/ui';

import { useLedgerStore } from '@/state/ledger-store';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const;

export default function NewEntryScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const insets = useSafeAreaInsets();
  const categories = useLedgerStore((state) => state.categories);
  const addEntry = useLedgerStore((state) => state.addEntry);

  const kind = params.kind === 'income' ? 'income' : 'expense';
  const visibleCategories = categories.filter((category) => category.kind === kind);

  const [raw, setRaw] = useState('');
  const [categoryId, setCategoryId] = useState<string>(visibleCategories[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  const amount = parseAmount(raw === '' ? '0' : raw);
  const canSave = amount.amountCents > 0 && categoryId !== '';

  function press(key: (typeof KEYS)[number]) {
    setError(null);
    if (key === 'del') {
      setRaw((current) => current.slice(0, -1));
      return;
    }
    if (key === '.' && raw.includes('.')) {
      return;
    }
    if (key === '.' && raw === '') {
      setRaw('0.');
      return;
    }
    const next = `${raw}${key}`;
    if (next.replace('.', '').length > 9) {
      return;
    }
    setRaw(next);
  }

  async function save() {
    const parsed = parseAmount(raw);
    const validation = validateEntry({
      amountCents: parsed.amountCents,
      kind,
      categoryId,
      note,
      occurredOn: date,
    });

    if (!validation.ok) {
      setError(validation.errors[0] ?? 'Check the entry');
      return;
    }

    await addEntry({
      amountCents: parsed.amountCents,
      kind,
      categoryId,
      note,
      occurredOn: date,
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.grabber} />

        <View style={styles.headerRow}>
          <Text style={styles.title}>{kind === 'expense' ? 'New expense' : 'New income'}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={styles.close}
          >
            <Icon name="x" size={18} color={palette.ink} />
          </Pressable>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.currency, { opacity: raw === '' ? 0.35 : 1 }]}>¥</Text>
          <Text style={[styles.amount, { opacity: raw === '' ? 0.35 : 1 }]}>
            {raw === '' ? '0' : raw}
          </Text>
        </View>

        <View style={styles.dateRow}>
          <Chip label={date === todayIso() ? 'Today' : date} emoji="📅" accent={palette.gold} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            onPress={() => setDate(shift(date, -1))}
            style={styles.dayButton}
          >
            <Icon name="chevron-left" size={16} color={palette.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next day"
            onPress={() => setDate(shift(date, 1))}
            style={styles.dayButton}
          >
            <Icon name="chevron-right" size={16} color={palette.ink} />
          </Pressable>
        </View>

        <View style={styles.categoryList}>
          {visibleCategories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              emoji={category.emoji}
              accent={category.color}
              selected={category.id === categoryId}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </View>

        <Card tone="muted" style={styles.noteCard} padded={false}>
          <Text style={styles.noteLabel}>Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Coffee with a friend"
            placeholderTextColor={palette.inkSoft}
            style={styles.noteInput}
            maxLength={80}
            returnKeyType="done"
          />
        </Card>

        {error === null ? null : <Text style={styles.error}>{error}</Text>}

        <View style={styles.keypad}>
          {KEYS.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === 'del' ? 'Delete' : key}
              onPress={() => press(key)}
              style={({ pressed }) => [
                styles.key,
                pressed && styles.keyPressed,
                key === 'del' && styles.keyDelete,
              ]}
            >
              {key === 'del' ? (
                <Icon name="chevron-left" size={20} color={palette.ink} />
              ) : (
                <Text style={styles.keyLabel}>{key}</Text>
              )}
            </Pressable>
          ))}
        </View>

        <Button
          label="Save it"
          tone={kind === 'expense' ? 'coral' : 'teal'}
          size="lg"
          fullWidth
          disabled={!canSave}
          onPress={() => {
            void save();
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function shift(date: string, days: number): string {
  const cursor = new Date(`${date}T00:00:00`);
  cursor.setDate(cursor.getDate() + days);
  return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
    cursor.getDate(),
  ).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(49, 23, 3, 0.35)',
  },
  sheet: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: palette.canvas,
    borderTopWidth: 3,
    borderColor: palette.ink,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  grabber: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    marginBottom: spacing.xs,
    backgroundColor: palette.inkSoft,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h1,
    color: palette.ink,
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
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  currency: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.inkMuted,
    paddingBottom: 8,
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 50,
    color: palette.ink,
    fontVariant: ['tabular-nums'],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 999,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
  },
  noteLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    color: palette.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteInput: {
    flex: 1,
    paddingVertical: 6,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: palette.ink,
  },
  error: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.small,
    color: palette.danger,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  key: {
    width: '31.5%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: radius.button,
    boxShadow: '0px 3px 0px #311703',
  },
  keyPressed: {
    transform: [{ translateY: 2 }],
    boxShadow: '0px 1px 0px #311703',
  },
  keyDelete: {
    backgroundColor: palette.surfaceMuted,
  },
  keyLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
});
