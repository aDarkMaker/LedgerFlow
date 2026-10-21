import { Platform, type ColorValue } from 'react-native';
import { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect, Svg } from 'react-native-svg';

import { palette } from '../tokens';

import { lucideIcons, type IconName } from './lucide.generated';

import type { IconShape } from './types';

type Props = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
};

/** Renders iconify geometry as a single stroked SVG so weight stays consistent. */
export function Icon({ name, size = 22, color = palette.ink, strokeWidth = 2 }: Props) {
  const icon = lucideIcons[name];
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      {...(Platform.OS === 'web' ? {} : { accessible: false })}
    >
      {icon.shapes.map((shape, index) => renderShape(shape, index, stroke))}
    </Svg>
  );
}

function renderShape(
  shape: IconShape,
  index: number,
  stroke: {
    stroke: ColorValue;
    strokeWidth: number;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
    fill: 'none';
  },
) {
  switch (shape.tag) {
    case 'path':
      return shape.d === null ? null : <Path key={index} d={shape.d} {...stroke} />;
    case 'circle':
      return (
        <Circle key={index} cx={shape.cx ?? 0} cy={shape.cy ?? 0} r={shape.r ?? 0} {...stroke} />
      );
    case 'ellipse':
      return (
        <Ellipse
          key={index}
          cx={shape.cx ?? 0}
          cy={shape.cy ?? 0}
          rx={shape.rx ?? 0}
          ry={shape.ry ?? 0}
          {...stroke}
        />
      );
    case 'rect':
      return (
        <Rect
          key={index}
          x={shape.x ?? 0}
          y={shape.y ?? 0}
          width={shape.width ?? 0}
          height={shape.height ?? 0}
          rx={shape.rx ?? 0}
          {...stroke}
        />
      );
    case 'line':
      return (
        <Line
          key={index}
          x1={shape.x1 ?? 0}
          y1={shape.y1 ?? 0}
          x2={shape.x2 ?? 0}
          y2={shape.y2 ?? 0}
          {...stroke}
        />
      );
    case 'polyline':
      return shape.points === null ? null : (
        <Polyline key={index} points={shape.points} {...stroke} />
      );
    case 'polygon':
      return shape.points === null ? null : (
        <Polygon key={index} points={shape.points} {...stroke} />
      );
    default:
      return null;
  }
}

export type { IconName };
