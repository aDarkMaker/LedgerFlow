import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon, type IconName } from '../icons';
import { border, fonts, fontSize, palette, radius, shadow, spacing } from '../tokens';

type Props = {
  label: string;
  icon?: IconName;
  selected?: boolean;
  accent?: string;
  onPress?: () => void;
};

export function Chip({ label, icon, selected = false, accent = palette.coral, onPress }: Props) {
  const background = selected ? accent : palette.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          boxShadow: pressed ? shadow.pressed : shadow.card,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}
    >
      {icon === undefined ? null : <Icon name={icon} size={15} color={palette.ink} />}
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderWidth: border.thin,
    borderColor: palette.ink,
    borderRadius: radius.chip,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.small,
    color: palette.ink,
  },
  labelSelected: {
    color: palette.ink,
  },
});
