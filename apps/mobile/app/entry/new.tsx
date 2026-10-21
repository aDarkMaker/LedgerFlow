import { useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Dimensions,
  Keyboard,
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

import { parseAmount, todayIso, validateEntry, type Category } from '@ledgerflow/core';
import { Button, Chip, fonts, fontSize, Icon, palette, radius, spacing } from '@ledgerflow/ui';

import { categoryIconName } from '@/components/category-icon';
import { blurActiveElement } from '@/lib/focus';
import { useLedgerStore } from '@/state/ledger-store';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const;
const SHEET_MS = 300;
const KIND_MS = 220;
const SCREEN_H = Dimensions.get('window').height;
const WINDOW_W = Dimensions.get('window').width;
const SHEET_BORDER = 3;
const GRABBER_BLOCK = 13;
const HEADER_H = 34;
const TRACK_BLOCK = 58;
const CONTENT_TOP = 8;
const ROW_GAP = 8;
const DATE_ROW_H = 40;
const NOTE_H = 48;
const ERROR_H = 18;
const SAVE_H = 56;
const FOOTER_TOP = 8;
const BOTTOM_GAP = 8;

type Metrics = {
  keyH: number;
  keyGap: number;
  swatch: number;
  gridGap: number;
  tileH: number;
  gridOneH: number;
  gridTwoH: number;
  amountSize: number;
  amountH: number;
  pad: number;
  contentW: number;
};

/**
 * Every block is sized from the viewport so the resting sheet never scrolls. Only the grid
 * container animates between one and two rows, so switching kinds moves a single height.
 */
function metricsFor(height: number, bottomInset: number): Metrics {
  const pad = height < 700 ? 8 : height < 820 ? 12 : 16;
  const keyGap = height < 820 ? 6 : 8;
  const gridGap = height < 820 ? 6 : 8;
  const swatch = height < 700 ? 32 : height < 820 ? 38 : 42;
  const tileH = swatch + 20;
  const amountSize = height < 700 ? 28 : height < 820 ? 36 : 44;
  const amountH = Math.ceil(amountSize * 1.12);
  const gridOneH = tileH;
  const gridTwoH = tileH * 2 + gridGap;

  const fixed =
    pad +
    GRABBER_BLOCK +
    HEADER_H +
    TRACK_BLOCK +
    CONTENT_TOP +
    amountH +
    ROW_GAP +
    DATE_ROW_H +
    ROW_GAP * 3 +
    NOTE_H +
    ERROR_H +
    FOOTER_TOP +
    keyGap +
    SAVE_H +
    bottomInset +
    BOTTOM_GAP +
    SHEET_BORDER;

  const keySpace = Math.floor(height * 0.96) - fixed - gridTwoH;
  const keyH = Math.max(26, Math.min(52, Math.floor((keySpace - keyGap * 3) / 4)));

  return {
    pad,
    keyGap,
    swatch,
    gridGap,
    tileH,
    gridOneH,
    gridTwoH,
    amountSize,
    amountH,
    keyH,
    contentW: WINDOW_W - SHEET_BORDER * 2 - pad * 2,
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  'amount-required': 'Enter an amount',
  'amount-not-positive': 'Amount must be above zero',
  'amount-too-large': 'That amount is too large',
  'category-required': 'Pick a category',
  'date-invalid': 'Pick a valid date',
};

type Kind = 'expense' | 'income';

export default function NewEntryScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const insets = useSafeAreaInsets();
  const categories = useLedgerStore((state) => state.categories);
  const addEntry = useLedgerStore((state) => state.addEntry);
  const metrics = metricsFor(SCREEN_H, insets.bottom);
  // The sheet is often narrower than the window, so widths follow its measured content box.
  const [contentW, setContentW] = useState(metrics.contentW);
  // Floored so four tiles (or three keys) plus their gaps can never wrap or overflow.
  const tileWidth = Math.floor((contentW - metrics.gridGap * 3) / 4);
  const keyWidth = Math.floor((contentW - metrics.keyGap * 2) / 3);

  const progress = useSharedValue(0);
  const sheetHeight = useSharedValue(SCREEN_H);
  const kindProgress = useSharedValue(params.kind === 'income' ? 1 : 0);
  const gridProgress = useSharedValue(1);
  const gridHeight = useSharedValue(params.kind === 'income' ? metrics.gridOneH : metrics.gridTwoH);
  const trackWidth = useSharedValue(0);
  const [measured, setMeasured] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const closing = useRef(false);

  const [kind, setKind] = useState<Kind>(params.kind === 'income' ? 'income' : 'expense');
  const visibleCategories = categories.filter((category) => category.kind === kind);

  const [raw, setRaw] = useState('');
  const [categoryId, setCategoryId] = useState<string>(
    () => categories.find((category) => category.kind === kind)?.id ?? '',
  );
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  const amount = parseAmount(raw === '' ? '0' : raw);
  const amountSize = metrics.amountSize - Math.max(0, raw.length - 5) * 3;
  const canSave = amount.amountCents > 0 && categoryId !== '';

  // Drop focus from the underlying tab before it is marked aria-hidden.
  useEffect(() => {
    blurActiveElement();
  }, []);

  // The sheet is measured first so the slide starts fully off screen at any height.
  useEffect(() => {
    if (!measured) {
      return;
    }
    progress.set(
      withTiming(1, {
        duration: SHEET_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [measured, progress]);

  // Only a raised keyboard may scroll the sheet; the resting sheet always fits.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  function goBack() {
    blurActiveElement();
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

  function switchKind(next: Kind) {
    if (next === kind) {
      return;
    }
    void Haptics.selectionAsync();
    const nextHeight = next === 'income' ? metrics.gridOneH : metrics.gridTwoH;
    kindProgress.set(withTiming(next === 'income' ? 1 : 0, { duration: KIND_MS }));
    gridHeight.set(withTiming(nextHeight, { duration: KIND_MS, easing: Easing.out(Easing.cubic) }));
    gridProgress.set(0);
    gridProgress.set(withTiming(1, { duration: KIND_MS, easing: Easing.out(Easing.cubic) }));
    setKind(next);
    setCategoryId(categories.find((category) => category.kind === next)?.id ?? '');
    setError(null);
  }

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [sheetHeight.value, 0]) }],
  }));

  const sliderStyle = useAnimatedStyle(() => {
    const width = Math.max(0, trackWidth.value / 2);
    return {
      width,
      transform: [{ translateX: kindProgress.value * width }],
    };
  });

  const gridStyle = useAnimatedStyle(() => ({
    opacity: gridProgress.value,
    transform: [{ translateY: interpolate(gridProgress.value, [0, 1], [4, 0]) }],
  }));

  const gridClipStyle = useAnimatedStyle(() => ({
    height: gridHeight.value,
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
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height <= 0) {
            return;
          }
          sheetHeight.set(height);
          setMeasured(true);
        }}
        style={[
          styles.sheet,
          sheetStyle,
          {
            paddingHorizontal: metrics.pad,
            paddingTop: metrics.pad,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
      >
        <View style={styles.grabber} />
        <View
          onLayout={(event) => {
            const width = Math.round(event.nativeEvent.layout.width);
            if (width > 0 && width !== contentW) {
              setContentW(width);
            }
          }}
          style={styles.headerRow}
        >
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

        <View style={styles.track}>
          <View
            onLayout={(event) => {
              trackWidth.set(event.nativeEvent.layout.width);
            }}
            style={styles.trackInner}
          >
            <Animated.View
              style={[
                styles.slider,
                { backgroundColor: kind === 'income' ? palette.teal : palette.coral },
                sliderStyle,
              ]}
            />
            <Segment
              label="Expense"
              icon="arrow-up-right"
              active={kind === 'expense'}
              onPress={() => switchKind('expense')}
            />
            <Segment
              label="Income"
              icon="arrow-down-left"
              active={kind === 'income'}
              onPress={() => switchKind('income')}
            />
          </View>
        </View>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          scrollEnabled={keyboardOpen}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.amountRow, { height: metrics.amountH }]}>
            <Text style={[styles.currency, { opacity: raw === '' ? 0.35 : 1 }]}>¥</Text>
            <Text
              style={[
                styles.amount,
                raw === '' && styles.amountEmpty,
                { fontSize: Math.max(22, amountSize), lineHeight: Math.max(28, amountSize * 1.12) },
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

          <Animated.View style={[styles.gridClip, gridClipStyle]}>
            <Animated.View style={[styles.categoryGrid, gridStyle, { gap: metrics.gridGap }]}>
              {visibleCategories.map((category) => (
                <CategoryTile
                  key={category.id}
                  category={category}
                  width={tileWidth}
                  height={metrics.tileH}
                  swatch={metrics.swatch}
                  selected={category.id === categoryId}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setCategoryId(category.id);
                    setError(null);
                  }}
                />
              ))}
            </Animated.View>
          </Animated.View>

          <View style={styles.noteRow}>
            <Icon name="notebook-pen" size={14} color={palette.inkSoft} />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note"
              placeholderTextColor={palette.inkSoft}
              style={styles.noteInput}
              maxLength={80}
              returnKeyType="done"
              autoCapitalize="sentences"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              selectionColor={palette.ink}
            />
          </View>

          <View style={styles.errorSlot}>
            {error === null ? null : (
              <Text style={styles.error} numberOfLines={1}>
                {error}
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { gap: metrics.keyGap }]}>
          <View style={[styles.keypad, { gap: metrics.keyGap }]}>
            {KEYS.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === 'del' ? 'Delete' : key}
                onPress={() => press(key)}
                style={({ pressed }) => [
                  styles.key,
                  { width: keyWidth, height: metrics.keyH },
                  pressed && styles.keyPressed,
                  key === 'del' && styles.keyDelete,
                ]}
              >
                {key === 'del' ? (
                  <Icon name="delete" size={18} color={palette.ink} />
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
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function Segment({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: 'arrow-up-right' | 'arrow-down-left';
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.segment}
    >
      <Icon name={icon} size={15} color={palette.ink} strokeWidth={2.4} />
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function CategoryTile({
  category,
  width,
  height,
  swatch,
  selected,
  onPress,
}: {
  category: Category;
  width: number;
  height: number;
  swatch: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={category.name}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width, height }, pressed && styles.tilePressed]}
    >
      <View
        style={[
          styles.swatch,
          { backgroundColor: category.color, width: swatch, height: swatch },
          selected && styles.swatchSelected,
        ]}
      >
        <Icon
          name={categoryIconName(category.id)}
          size={swatch * 0.46}
          color={palette.ink}
          strokeWidth={2.1}
        />
      </View>
      <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]} numberOfLines={1}>
        {category.name}
      </Text>
    </Pressable>
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
    flexShrink: 1,
    backgroundColor: palette.surface,
    borderWidth: SHEET_BORDER,
    borderBottomWidth: 0,
    borderColor: palette.ink,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    boxShadow: '0px -3px 0px #311703',
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
    height: HEADER_H,
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
  track: {
    marginTop: spacing.sm,
    padding: 4,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: radius.button,
  },
  trackInner: {
    flexDirection: 'row',
  },
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.button - 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 38,
    borderRadius: radius.button - 4,
  },
  segmentLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  segmentLabelActive: {
    color: palette.ink,
  },
  contentScroll: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: CONTENT_TOP,
  },
  content: {
    gap: ROW_GAP,
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
    paddingBottom: 4,
  },
  amount: {
    fontFamily: fonts.display,
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
    height: DATE_ROW_H,
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
  gridClip: {
    overflow: 'hidden',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tilePressed: {
    opacity: 0.7,
  },
  swatch: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: palette.ink,
  },
  tileLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: palette.inkMuted,
  },
  tileLabelSelected: {
    fontFamily: fonts.bodySemiBold,
    color: palette.ink,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: NOTE_H,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: palette.hairline,
    borderRadius: radius.button,
    backgroundColor: palette.surfaceMuted,
  },
  noteInput: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: palette.ink,
  },
  errorSlot: {
    height: ERROR_H,
    justifyContent: 'center',
  },
  error: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.small,
    color: palette.danger,
  },
  footer: {
    paddingTop: FOOTER_TOP,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  key: {
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
