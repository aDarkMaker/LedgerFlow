import { StyleSheet, View, Text } from 'react-native';

import { fonts, fontSize, palette, spacing, SyncBadge } from '@ledgerflow/ui';

type Props = {
  eyebrow: string;
  title: string;
  streak?: number;
  offline?: boolean;
  pendingCount?: number;
};

export function ScreenHeader({ eyebrow, title, streak, offline = false, pendingCount = 0 }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        {streak === undefined ? null : (
          <View style={styles.streak}>
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <SyncBadge offline={offline} pendingCount={pendingCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: palette.inkMuted,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    color: palette.ink,
  },
  streak: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: palette.coral,
    borderColor: palette.ink,
    borderWidth: 2,
    borderRadius: 999,
  },
  streakText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    color: palette.ink,
  },
});
