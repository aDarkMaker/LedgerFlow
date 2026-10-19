import { StyleSheet, Text, View } from 'react-native';

import { describeMoney, formatMoney, type Money } from '@ledgerflow/core';

import { fonts, fontSize, palette } from '../tokens';

type Props = {
  value: Money;
  size?: 'hero' | 'display' | 'h1' | 'body';
  tone?: 'ink' | 'coral' | 'teal' | 'muted';
  showSymbol?: boolean;
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

/** Tabular numerals keep the layout stable while the amount animates. */
export function AmountText({ value, size = 'h1', tone = 'ink', showSymbol = true }: Props) {
  return (
    <View accessible accessibilityLabel={describeMoney(value)}>
      <Text
        style={[
          styles.text,
          { fontSize: SIZES[size], color: TONES[tone], lineHeight: SIZES[size] * 1.15 },
        ]}
        allowFontScaling={false}
      >
        {formatMoney(value, { withSymbol: showSymbol })}
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
