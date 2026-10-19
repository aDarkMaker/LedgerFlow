import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { formatMoney, money, type CategoryTotal, type DailyTotal } from '@ledgerflow/core';
import { fonts, fontSize, palette, spacing } from '@ledgerflow/ui';

type BarChartProps = {
  data: readonly DailyTotal[];
  today: string;
  height?: number;
};

/** Bars grow from the baseline; today keeps the ink accent so it reads first. */
export function DailyBars({ data, today, height = 140 }: BarChartProps) {
  const max = Math.max(...data.map((item) => item.totalCents), 1);
  const barWidth = 100 / Math.max(data.length, 1);

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`}>
        {data.map((item, index) => {
          const ratio = item.totalCents / max;
          const barHeight = Math.max(item.totalCents === 0 ? 2 : 6, ratio * (height - 12));
          const fill = item.date === today ? palette.ink : palette.coral;
          return (
            <Rect
              key={item.date}
              x={index * barWidth + barWidth * 0.18}
              y={height - barHeight}
              width={barWidth * 0.64}
              height={barHeight}
              rx={3}
              fill={fill}
              stroke={palette.ink}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
      <View style={styles.axis}>
        {data.map((item) => (
          <Text key={item.date} style={[styles.axisLabel, item.date === today && styles.axisToday]}>
            {item.date.slice(8)}
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
        <G rotation={-90} originX={55} originY={55}>
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
        <Text style={styles.donutValue}>
          {formatMoney(money(totalCents), { withSymbol: false })}
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
