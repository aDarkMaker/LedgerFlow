import { useMemo } from 'react';

import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { dailyTotals, formatMoney, lastNDates, money, monthBounds } from '@ledgerflow/core';
import { AmountText, Button, Card, fonts, fontSize, palette, spacing } from '@ledgerflow/ui';

import { CategoryDonut, DailyBars, StreakHeatmap } from '@/components/charts';
import { ScreenHeader } from '@/components/screen-header';
import { selectLedgerView, useLedgerStore } from '@/state/ledger-store';
import { usePendingCount, useSyncStatus } from '@/state/sync';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { online } = useSyncStatus();
  const pendingCount = usePendingCount();
  const view = useLedgerStore(useShallow(selectLedgerView));
  const period = useLedgerStore((state) => state.period);
  const selectedDate = useLedgerStore((state) => state.selectedDate);

  const last14 = useMemo(() => lastNDates(selectedDate, 14), [selectedDate]);
  const bars = useMemo(() => dailyTotals(view.monthEntries, last14), [view.monthEntries, last14]);

  const heatmap = useMemo(() => {
    const dates = lastNDates(selectedDate, 28);
    const totals = new Map(dailyTotals(view.monthEntries, dates).map((d) => [d.date, d]));
    return Array.from({ length: 4 }, (_, week) =>
      dates.slice(week * 7, week * 7 + 7).map((date) => ({
        date,
        totalCents: totals.get(date)?.totalCents ?? 0,
      })),
    );
  }, [view.monthEntries, selectedDate]);

  const monthTotal = money(view.monthExpenseCents);
  const monthSpentBound = monthBounds(period);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow={`${period} · ${monthSpentBound.end.slice(8)} days`}
          title="Where it flows"
          streak={view.streak.current}
          offline={!online}
          pendingCount={pendingCount}
        />

        <Card tone="muted" style={styles.totalCard}>
          <Text style={styles.totalLabel}>Spent this month</Text>
          <AmountText value={monthTotal} size="display" />
          <Text style={styles.totalHint}>
            Projected {formatMoney(money(view.budget.projectedCents))} · budget{' '}
            {formatMoney(money(view.budget.budgetCents))}
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Last 14 days</Text>
        <Card tone="surface">
          <DailyBars data={bars} today={selectedDate} />
        </Card>

        <View style={styles.split}>
          <Card tone="surface" style={styles.donutCard}>
            <CategoryDonut slices={view.breakdown} totalCents={view.monthExpenseCents} />
          </Card>
          <Card tone="surface" style={styles.legendCard}>
            {view.breakdown.length === 0 ? (
              <Text style={styles.legendEmpty}>No spend yet</Text>
            ) : (
              view.breakdown.slice(0, 5).map((item) => (
                <View key={item.categoryId} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.legendShare}>{Math.round(item.share * 100)}%</Text>
                </View>
              ))
            )}
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Logging streak</Text>
        <Card tone="surface" style={styles.streakCard}>
          <StreakHeatmap weeks={heatmap} />
          <View style={styles.streakCopy}>
            <Text style={styles.streakValue}>{view.streak.current} days</Text>
            <Text style={styles.streakHint}>Best run {view.streak.longest} days</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            label="Set budget"
            tone="teal"
            onPress={() => router.push('/budget')}
            style={styles.actionButton}
          />
          <Button
            label="Design gallery"
            tone="ghost"
            onPress={() => router.push('/(dev)/gallery')}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  totalCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: palette.inkMuted,
  },
  totalHint: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  split: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  donutCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  legendCard: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: palette.ink,
  },
  legendName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.ink,
  },
  legendShare: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  legendEmpty: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  streakCopy: {
    alignItems: 'flex-end',
    gap: 2,
  },
  streakValue: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  streakHint: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
});
