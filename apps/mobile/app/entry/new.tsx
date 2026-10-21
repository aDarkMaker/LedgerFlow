import { useEffect, useRef, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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

import { categoryIconName } from '@/components/category-icon';
import { useLedgerStore } from '@/state/ledger-store';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const;
const SHEET_MS = 280;
const SCREEN_H = Dimensions.get('window').height;

const ERROR_MESSAGES: Record<string, string> = {
  'amount-required': 'Enter an amount',
  'amount-not-positive': 'Amount must be above zero',
  'amount-too-large': 'That amount is too large',
  'category-required': 'Pick a category',
  'date-invalid': 'Pick a valid date',
};

export default function NewEntryScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const insets = useSafeAreaInsets();
  const categories = useLedgerStore((state) => state.categories);
  const addEntry = useLedgerStore((state) => state.addEntry);
  const progress = useSharedValue(0);
  const closing = useRef(false);

  const kind = params.kind === 'income' ? 'income' : 'expense';
  const visibleCategories = categories.filter((category) => category.kind === kind);

  const [raw, setRaw] = useState('');
  const [categoryId, setCategoryId] = useState<string>(visibleCategories[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  const amount = parseAmount(raw === '' ? '0' : raw);
  const amountSize = 44 - Math.max(0, raw.length - 5) * 3.2;
  const canSave = amount.amountCents > 0 && categoryId !== '';

  useEffect(() => {
    progress.set(
      withTiming(1, {
        duration: SHEET_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [progress]);

  function goBack() {
    router.back();
  }

  function dismiss() {
    if (closing.current) {
      return;
    }
    closing.current = true;
    progress.set(
      withTiming(0, { duration: SHEET_MS - 40, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(goBack)();
        }
      }),
    );
  }

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [SCREEN_H * 0.72, 0]),
      },
    ],
  }));

  function press(key: (typeof KEYS)[number]) {
    setError(null);
    setRaw((current) => {
      if (key === 'del') {
        return current.slice(0, -1);
      }
      if (key === '.') {
        return current.includes('.') ? current : current === '' ? '0.' : `${current}.`;
      }
      const next = `${current}${key}`;
      const [whole = '', fraction = ''] = next.split('.');
      if (whole.length > 7 || fraction.length > 2) {
        return current;
      }
      return next;
    });
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
      setError(ERROR_MESSAGES[validation.errors[0] ?? ''] ?? 'Check the entry');
      return;
    }

    await addEntry({
      amountCents: parsed.amountCents,
      kind,
      categoryId,
      note,
      occurredOn: date,
    });
    dismiss();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={dismiss}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.grabber} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{kind === 'expense' ? 'New expense' : 'New income'}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={dismiss}
            style={styles.close}
          >
            <Icon name="x" size={18} color={palette.ink} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sheetContent}
        >
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { opacity: raw === '' ? 0.35 : 1 }]}>¥</Text>
            <Text
              style={[
                styles.amount,
                raw === '' && styles.amountEmpty,
                { fontSize: Math.max(24, amountSize), lineHeight: Math.max(30, amountSize * 1.14) },
              ]}
              numberOfLines={1}
            >
              {raw === '' ? '0' : raw}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Chip
              label={date === todayIso() ? 'Today' : date}
              icon="calendar"
              accent={palette.gold}
            />
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
                icon={categoryIconName(category.id)}
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
              autoCapitalize="sentences"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              selectionColor={palette.ink}
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
                  <Icon name="delete" size={20} color={palette.ink} />
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
        </ScrollView>
      </Animated.View>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(49, 23, 3, 0.18)',
  },
  sheet: {
    maxHeight: '92%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: palette.surface,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: palette.ink,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    boxShadow: '0px -3px 0px #311703',
  },
  sheetContent: {
    gap: spacing.sm,
  },
  sheetScroll: {
    flexShrink: 1,
    marginTop: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    marginBottom: spacing.sm,
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
    flexShrink: 1,
  },
  amountEmpty: {
    opacity: 0.35,
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
