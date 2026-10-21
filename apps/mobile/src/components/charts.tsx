import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { formatMoneyCompact, money, type CategoryTotal, type DailyTotal } from '@ledgerflow/core';
import { fonts, fontSize, palette, spacing } from '@ledgerflow/ui';

type BarChartProps = {
  data: readonly DailyTotal[];
  today: string;
  height?: number;
};

/** Bars grow from the baseline; today keeps the ink accent so it reads first. */
export function DailyBars({ data, today, height = 140 }: BarChartProps) {
  const max = Math.max(...data.map((item) => item.totalCents), 1);
  const count = Math.max(data.length, 1);
  const gap = 0.28;
  const todayIndex = data.findIndex((item) => item.date === today);
  const parity = todayIndex >= 0 ? todayIndex % 2 : 0;

  return (
    <View>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${count} ${height}`}
        preserveAspectRatio="none"
      >
        {data.map((item, index) => {
          const empty = item.totalCents === 0;
          const h = empty
            ? height * 0.02
            : Math.max(height * 0.08, (item.totalCents / max) * (height - 16));
          return (
            <Rect
              key={item.date}
              x={index + gap / 2}
              y={height - h}
              width={1 - gap}
              height={h}
              rx={0.12}
              fill={empty ? palette.hairline : item.date === today ? palette.ink : palette.coral}
              stroke={empty ? 'none' : palette.ink}
              strokeWidth={empty ? 0 : 1.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </Svg>
      <View style={styles.axis}>
        {data.map((item, index) => (
          <Text key={item.date} style={[styles.axisLabel, item.date === today && styles.axisToday]}>
            {index % 2 === parity ? item.date.slice(8) : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

type DonutProps = {
  slices: readonly CategoryTotal[];
  totalCents: number;
};

const RADIUS = 42;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut is drawn as stacked arcs so each category keeps its own colour. */
export function CategoryDonut({ slices, totalCents }: DonutProps) {
  const arcs = slices.reduce<{ slice: CategoryTotal; dash: number; offset: number }[]>(
    (acc, slice) => {
      const previous = acc[acc.length - 1];
      const offset = previous === undefined ? 0 : previous.offset + previous.dash;
      acc.push({ slice, dash: slice.share * CIRCUMFERENCE, offset });
      return acc;
    },
    [],
  );

  return (
    <View style={styles.donutWrapper}>
      <Svg width={132} height={132} viewBox="0 0 110 110">
        <G transform="rotate(-90 55 55)">
          <Circle
            cx={55}
            cy={55}
            r={RADIUS}
            stroke={palette.hairline}
            strokeWidth={STROKE}
            fill="none"
          />
          {arcs.map((arc) => (
            <Circle
              key={arc.slice.categoryId}
              cx={55}
              cy={55}
              r={RADIUS}
              stroke={arc.slice.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
              strokeDashoffset={-arc.offset}
              fill="none"
            />
          ))}
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutLabel}>Total</Text>
        <Text style={styles.donutValue} numberOfLines={1}>
          {formatMoneyCompact(money(totalCents), { withSymbol: false })}
        </Text>
      </View>
    </View>
  );
}

type HeatmapProps = {
  weeks: readonly (readonly { date: string; totalCents: number }[])[];
};

/** Four-week grid: a filled cell means at least one entry that day. */
export function StreakHeatmap({ weeks }: HeatmapProps) {
  return (
    <View style={styles.heatmap}>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.heatmapColumn}>
          {week.map((day) => (
            <View
              key={day.date}
              style={[styles.heatCell, day.totalCents > 0 ? styles.heatCellActive : undefined]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function Sparkline({ data }: { data: readonly number[] }) {
  if (data.length < 2) {
    return null;
  }
  const max = Math.max(...data, 1);
  const path = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 28 - (value / max) * 24;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <Svg width="100%" height={30} viewBox="0 0 100 30">
      <Path d={path} stroke={palette.teal} strokeWidth={2.4} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  axis: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  axisLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: palette.inkMuted,
  },
  axisToday: {
    fontFamily: fonts.bodySemiBold,
    color: palette.ink,
  },
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.inkMuted,
  },
  donutValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  heatmap: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapColumn: {
    gap: 4,
  },
  heatCell: {
    width: 18,
    height: 18,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1.5,
    borderColor: palette.hairline,
    borderRadius: 5,
  },
  heatCellActive: {
    backgroundColor: palette.coral,
    borderColor: palette.ink,
  },
});
