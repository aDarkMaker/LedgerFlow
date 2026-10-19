import { StyleSheet, View, type ViewProps } from 'react-native';

import { border, palette, radius, shadow, spacing } from '../tokens';

type Props = ViewProps & {
  tone?: 'canvas' | 'surface' | 'muted' | 'coral' | 'gold' | 'teal';
  padded?: boolean;
  flat?: boolean;
};

const TONE_BACKGROUNDS = {
  canvas: palette.canvas,
  surface: palette.surface,
  muted: palette.surfaceMuted,
  coral: palette.coral,
  gold: palette.gold,
  teal: palette.teal,
} as const;

export function Card({ tone = 'surface', padded = true, flat = false, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        { backgroundColor: TONE_BACKGROUNDS[tone], boxShadow: flat ? shadow.none : shadow.card },
        padded && styles.padded,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: border.thin,
    borderColor: palette.ink,
    borderRadius: radius.card,
  },
  padded: {
    padding: spacing.lg,
  },
});
