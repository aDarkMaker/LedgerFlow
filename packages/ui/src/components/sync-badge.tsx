import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../icons';
import { fonts, fontSize, palette, spacing } from '../tokens';

type Props = {
  offline: boolean;
  pendingCount: number;
};

/** Mirrors the outbox state so the user knows writes are queued, not lost. */
export function SyncBadge({ offline, pendingCount }: Props) {
  if (!offline && pendingCount === 0) {
    return null;
  }
  const label = offline ? 'Offline' : `${pendingCount} pending`;

  return (
    <View style={styles.wrapper}>
      <Icon name={offline ? 'cloud-off' : 'cloud-upload'} size={14} color={palette.ink} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: palette.gold,
    borderColor: palette.ink,
    borderWidth: 2,
    borderRadius: 999,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    color: palette.ink,
  },
});
