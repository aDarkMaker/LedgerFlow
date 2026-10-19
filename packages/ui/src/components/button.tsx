import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { border, fonts, fontSize, palette, radius, shadow, spacing } from '../tokens';

export type ButtonTone = 'coral' | 'gold' | 'teal' | 'ink' | 'ghost';
export type ButtonSize = 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
};

const TONES: Record<ButtonTone, { background: string; text: string }> = {
  coral: { background: palette.coral, text: palette.ink },
  gold: { background: palette.gold, text: palette.ink },
  teal: { background: palette.teal, text: palette.surface },
  ink: { background: palette.ink, text: palette.canvas },
  ghost: { background: palette.surface, text: palette.ink },
};

export function Button({
  label,
  onPress,
  tone = 'coral',
  size = 'md',
  disabled = false,
  fullWidth = false,
  accessibilityHint,
  style,
}: Props) {
  const toneStyles = TONES[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        {
          backgroundColor: toneStyles.background,
          boxShadow: pressed ? shadow.pressed : shadow.button,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: toneStyles.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border.thick,
    borderColor: palette.ink,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
  },
  md: {
    height: 48,
  },
  lg: {
    height: 56,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.heading,
    fontSize: fontSize.body,
    letterSpacing: 0.2,
  },
});
