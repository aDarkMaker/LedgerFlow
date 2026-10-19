import { useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon, type IconName } from '../icons';
import { border, motion, palette, radius, shadow } from '../tokens';

export type FanAction = {
  readonly key: string;
  readonly label: string;
  readonly icon: IconName;
  readonly accent: string;
  readonly onPress: () => void;
};

type Props = {
  actions: readonly [FanAction, FanAction, FanAction];
  triggerIcon?: IconName;
};

const TRIGGER_SIZE = 60;
const ACTION_SIZE = 52;
const OFFSET = TRIGGER_SIZE * 0.95;

const COLLAPSED_ROTATION = [90, -115, -45] as const;
const EXPANDED_ROTATION = [-90, 0, 90] as const;
const EXPANDED_OFFSETS = [-OFFSET, 0, OFFSET] as const;

/**
 * Collapsed actions hide behind the trigger with the original CSS rotations.
 * Opening fans them out, mirroring the hover interaction of the source component.
 */
export function FabFan({ actions, triggerIcon = 'sparkles' }: Props) {
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  function expand(next: boolean) {
    setOpen(next);
    progress.value = withSpring(next ? 1 : 0, motion.fan);
  }

  function toggle() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    expand(!open);
  }

  return (
    <View style={styles.stage} pointerEvents="box-none">
      {actions.map((action, index) => (
        <FanActionButton
          key={action.key}
          action={action}
          index={index}
          progress={progress}
          onPicked={() => expand(false)}
        />
      ))}
      <TriggerButton icon={triggerIcon} open={open} progress={progress} onPress={toggle} />
    </View>
  );
}

type ActionProps = {
  action: FanAction;
  index: number;
  progress: SharedValue<number>;
  onPicked: () => void;
};

function FanActionButton({ action, index, progress, onPicked }: ActionProps) {
  const collapsedRotation = COLLAPSED_ROTATION[index] ?? 90;
  const expandedRotation = EXPANDED_ROTATION[index] ?? 0;
  const expandedOffset = EXPANDED_OFFSETS[index] ?? 0;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [0, 1]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, expandedOffset]) },
      {
        rotate: `${interpolate(progress.value, [0, 1], [collapsedRotation, expandedRotation])}deg`,
      },
      { scale: interpolate(progress.value, [0, 1], [0.6, 1]) },
    ],
  }));

  return (
    <Animated.View style={[styles.actionSlot, animatedStyle]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={() => {
          void Haptics.selectionAsync();
          action.onPress();
          onPicked();
        }}
        style={({ pressed }) => [
          styles.action,
          {
            backgroundColor: action.accent,
            boxShadow: pressed ? shadow.pressed : shadow.card,
            transform: [{ translateY: pressed ? 2 : 0 }, { scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Icon name={action.icon} size={22} color={palette.ink} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
}

type TriggerProps = {
  icon: IconName;
  open: boolean;
  progress: SharedValue<number>;
  onPress: () => void;
};

function TriggerButton({ icon, open, progress, onPress }: TriggerProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` },
      { scale: interpolate(progress.value, [0, 1], [1, 1.05]) },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? 'Close quick actions' : 'Open quick actions'}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.trigger,
        { boxShadow: pressed ? shadow.pressed : shadow.lifted },
      ]}
    >
      <Animated.View style={animatedStyle}>
        <Icon name={icon} size={26} color={palette.canvas} strokeWidth={2.4} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: OFFSET * 2 + ACTION_SIZE,
    height: TRIGGER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSlot: {
    position: 'absolute',
  },
  action: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border.thick,
    borderColor: palette.ink,
    borderRadius: radius.button,
  },
  trigger: {
    width: TRIGGER_SIZE,
    height: TRIGGER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.ink,
    borderWidth: border.thick,
    borderColor: palette.ink,
    borderRadius: radius.button,
  },
});
