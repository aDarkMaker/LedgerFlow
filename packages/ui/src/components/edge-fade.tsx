import { useId } from 'react';

import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { palette } from '../tokens';

type Props = {
  side: 'left' | 'right';
  size?: number;
  color?: string;
};

/** Softens the clipped edge of horizontally scrolling content. */
export function EdgeFade({ side, size = 56, color = palette.canvas }: Props) {
  const gradientId = `fade${useId().replace(/[^a-zA-Z0-9]/g, '')}${side}`;
  const [x1, x2] = side === 'left' ? ['0%', '100%'] : ['100%', '0%'];

  return (
    <View
      pointerEvents="none"
      style={[styles.base, side === 'left' ? styles.left : styles.right, { width: size }]}
    >
      <Svg width={size} height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1={x1} y1="0%" x2={x2} y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="35%" stopColor={color} stopOpacity={0.76} />
            <Stop offset="68%" stopColor={color} stopOpacity={0.34} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  left: {
    left: 0,
  },
  right: {
    right: 0,
  },
});
