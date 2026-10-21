import { StyleSheet, Text, View } from 'react-native';

import { describeMoney, formatMoney, formatMoneyCompact, type Money } from '@ledgerflow/core';

import { fonts, fontSize, palette } from '../tokens';

type Props = {
  value: Money;
  size?: 'hero' | 'display' | 'h1' | 'body';
  tone?: 'ink' | 'coral' | 'teal' | 'muted';
  showSymbol?: boolean;
  /** Shrinks the type instead of wrapping once the amount gets long. */
  fit?: boolean;
};

const SIZES = {
  hero: fontSize.hero,
  display: fontSize.display,
  h1: fontSize.h1,
  body: fontSize.body,
} as const;

const TONES = {
  ink: palette.ink,
  coral: palette.coral,
  teal: palette.teal,
  muted: palette.inkMuted,
} as const;

const COMFORTABLE = 9;
const COMPACT_AFTER = 12;

/** Tabular numerals keep the layout stable while the amount animates. */
export function AmountText({
  value,
  size = 'h1',
  tone = 'ink',
  showSymbol = true,
  fit = true,
}: Props) {
  const full = formatMoney(value, { withSymbol: showSymbol });
  const text =
    fit && full.length > COMPACT_AFTER
      ? formatMoneyCompact(value, { withSymbol: showSymbol })
      : full;
  const base = SIZES[size];
  const overflow = fit ? Math.max(0, text.length - COMFORTABLE) : 0;
  const scaled = Math.max(base * 0.55, base - overflow * (base * 0.085));

  return (
    <View accessible accessibilityLabel={describeMoney(value)}>
      <Text
        style={[styles.text, { fontSize: scaled, color: TONES[tone], lineHeight: scaled * 1.18 }]}
        numberOfLines={1}
        adjustsFontSizeToFit={false}
        allowFontScaling={false}
        ellipsizeMode="tail"
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.heading,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
});
