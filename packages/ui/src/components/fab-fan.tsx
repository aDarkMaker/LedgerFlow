import { useEffect, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon, type IconName } from '../icons';
import { palette } from '../tokens';

export type FanAction = {
  readonly label: string;
  readonly icon: IconName;
  readonly accent: string;
  readonly onPress: () => void;
};

type Props = {
  actions: readonly [FanAction, FanAction];
};

/** Reference geometry: 12rem box, 3.2rem buttons, translate -170% / 70%. */
const BUTTON = 51.2;
const BOX_WIDTH = 192;
const BOX_HEIGHT = 80;
const GLYPH = 24;
const FAN_MS = 300;

const LEFT_SHIFT = -BUTTON * 1.2;
const RIGHT_SHIFT = BUTTON * 1.2;

const COLLAPSED = [90, -115] as const;
const EXPANDED = [-90, 90] as const;

export function FabFan({ actions }: Props) {
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(open ? 1 : 0, { duration: FAN_MS }));
  }, [open, progress]);

  function toggle() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen((current) => !current);
  }

  function run(action: FanAction | undefined) {
    if (!open) {
      setOpen(true);
      return;
    }
    void Haptics.selectionAsync();
    setOpen(false);
    action?.onPress();
  }

  return (
    <View style={styles.box}>
      <FanButton
        action={actions[0]}
        index={0}
        shift={LEFT_SHIFT}
        progress={progress}
        open={open}
        onPress={() => run(actions[0])}
      />
      <FanButton
        action={actions[1]}
        index={1}
        shift={RIGHT_SHIFT}
        progress={progress}
        open={open}
        onPress={() => run(actions[1])}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close quick actions' : 'Open quick actions'}
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={[styles.slot, styles.trigger]}
      >
        <TriggerGlyph progress={progress} />
      </Pressable>
    </View>
  );
}

function TriggerGlyph({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Icon name="plus" size={GLYPH} color="#FFFFFF" strokeWidth={2.8} />
    </Animated.View>
  );
}

type ButtonProps = {
  action: FanAction | undefined;
  index: number;
  shift: number;
  progress: SharedValue<number>;
  open: boolean;
  onPress: () => void;
};

function FanButton({ action, index, shift, progress, open, onPress }: ButtonProps) {
  const collapsed = COLLAPSED[index] ?? 0;
  const expanded = EXPANDED[index] ?? 0;

  const frameStyle = useAnimatedStyle(() => {
    const value = progress.value;
    return {
      opacity: interpolate(value, [0, 1], [0.85, 1]),
      transform: [
        { translateX: shift * value },
        { rotate: `${interpolate(value, [0, 1], [collapsed, expanded])}deg` },
      ],
    };
  });
  const glyphStyle = useAnimatedStyle(() => {
    const value = progress.value;
    return {
      transform: [{ rotate: `${-interpolate(value, [0, 1], [collapsed, expanded])}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.slot, { zIndex: 30 + index * 10 }, frameStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action?.label ?? 'Action'}
        accessibilityState={{ expanded: open }}
        onPress={onPress}
        style={[styles.button, { backgroundColor: action?.accent ?? palette.coral }]}
      >
        <Animated.View style={glyphStyle}>
          <Icon name={action?.icon ?? 'plus'} size={GLYPH} color="#FFFFFF" strokeWidth={2.4} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: {
    position: 'absolute',
    width: BUTTON,
    height: BUTTON,
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.ink,
    borderRadius: 5,
    boxShadow: 'inset 0 0 4px rgba(0, 0, 0, 0.4)',
  },
  trigger: {
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.teal,
    borderWidth: 3,
    borderColor: palette.ink,
    borderRadius: 5,
    boxShadow: 'inset 0 0 4px rgba(0, 0, 0, 0.4)',
  },
});
