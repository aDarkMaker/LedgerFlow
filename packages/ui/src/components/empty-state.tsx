import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '../icons';
import { fonts, fontSize, palette, spacing } from '../tokens';

type Props = {
  icon: IconName;
  title: string;
  hint: string;
};

export function EmptyState({ icon, title, hint }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.badge}>
        <Icon name={icon} size={34} color={palette.ink} />
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
  badge: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.ink,
    borderWidth: 2,
    borderRadius: 22,
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
