import { StyleSheet, Text, View } from 'react-native';

import { fonts, fontSize, palette, spacing } from '../tokens';

type Props = {
  emoji: string;
  title: string;
  hint: string;
};

export function EmptyState({ emoji, title, hint }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.emojiBadge}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emojiBadge: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.ink,
    borderWidth: 2,
    borderRadius: 22,
  },
  emoji: {
    fontSize: 34,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
