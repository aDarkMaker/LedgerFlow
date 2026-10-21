import { useMemo, useState } from 'react';

import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { describeMoney, formatMoneyCompact, money, monthKey, todayIso } from '@ledgerflow/core';
import {
  AmountText,
  Card,
  EdgeFade,
  FabFan,
  fonts,
  fontSize,
  palette,
  spacing,
} from '@ledgerflow/ui';
import type { FanAction } from '@ledgerflow/ui';

import { CategoryIcon } from '@/components/category-icon';
import { EntryRow } from '@/components/entry-row';
import { ScreenHeader } from '@/components/screen-header';
import { selectLedgerView, useLedgerStore } from '@/state/ledger-store';
import { usePendingCount, useSyncStatus } from '@/state/sync';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { online } = useSyncStatus();
  const pendingCount = usePendingCount();
  const view = useLedgerStore(useShallow(selectLedgerView));
  const allEntries = useLedgerStore((state) => state.entries);
  const categories = useLedgerStore((state) => state.categories);
  const selectedDate = useLedgerStore((state) => state.selectedDate);
  const removeEntry = useLedgerStore((state) => state.removeEntry);

  const categoryLookup = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const weekTotals = useMemo(() => {
    const dates = new Set(buildWeek(selectedDate));
    const totals = new Map<string, number>();
    for (const entry of allEntries) {
      if (entry.kind !== 'expense' || entry.deletedAt !== null || !dates.has(entry.occurredOn)) {
        continue;
      }
      totals.set(entry.occurredOn, (totals.get(entry.occurredOn) ?? 0) + entry.amountCents);
    }
    return totals;
  }, [allEntries, selectedDate]);

  const expense = money(view.dayExpenseCents);
  const allowance = money(view.budget.dailyAllowanceCents);

  const actions: readonly [FanAction, FanAction] = [
    {
      label: 'Add expense',
      icon: 'receipt',
      accent: palette.coral,
      onPress: () => router.push({ pathname: '/entry/new', params: { kind: 'expense' } }),
    },
    {
      label: 'Add income',
      icon: 'wallet',
      accent: palette.gold,
      onPress: () => router.push({ pathname: '/entry/new', params: { kind: 'income' } }),
    },
  ];

  const isToday = selectedDate === todayIso();

  const [chips, setChips] = useState({ atStart: true, atEnd: false });

  function onChipsScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const atStart = contentOffset.x <= 4;
    const atEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 4;
    setChips((current) =>
      current.atStart === atStart && current.atEnd === atEnd ? current : { atStart, atEnd },
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow={isToday ? 'Today' : selectedDate}
          title={isToday ? 'How much flowed out?' : 'That day'}
          streak={view.streak.current}
          offline={!online}
          pendingCount={pendingCount}
        />

        <Card tone="surface" style={styles.hero}>
          <Text style={styles.heroLabel}>Spent today</Text>
          <AmountText value={expense} size="hero" />
          <View style={styles.allowance}>
            <Text style={styles.allowanceLabel}>
              {view.budget.budgetCents === 0 ? 'No budget yet' : 'Can still spend'}
            </Text>
            <Text style={styles.allowanceValue} numberOfLines={1}>
              {view.budget.budgetCents === 0 ? 'Set one' : formatMoneyCompact(allowance)}
            </Text>
          </View>
        </Card>

        <View style={styles.week}>
          {buildWeek(selectedDate).map((date) => {
            const total = weekTotals.get(date) ?? 0;
            const active = date === selectedDate;
            return (
              <View key={date} style={[styles.weekCell, active && styles.weekCellActive]}>
                <Text style={[styles.weekDay, active && styles.weekDayActive]}>
                  {weekdayLabel(date)}
                </Text>
                <Text style={[styles.weekAmount, active && styles.weekDayActive]} numberOfLines={1}>
                  {total === 0 ? '–' : formatMoneyCompact(money(total), { withSymbol: false })}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Categories this month</Text>
        {view.breakdown.length === 0 ? (
          <Card tone="muted" style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nothing logged yet</Text>
            <Text style={styles.emptyHint}>
              Tap the sticker button to log your first expense of the day.
            </Text>
          </Card>
        ) : (
          <View style={styles.chipsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={onChipsScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.chips}
            >
              {view.breakdown.slice(0, 6).map((item) => (
                <Card key={item.categoryId} tone="surface" style={styles.chipCard} padded={false}>
                  <View style={[styles.chipSwatch, { backgroundColor: item.color }]}>
                    <CategoryIcon id={item.categoryId} />
                  </View>
                  <Text style={styles.chipName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.chipAmount} numberOfLines={1}>
                    {formatMoneyCompact(money(item.totalCents))}
                  </Text>
                </Card>
              ))}
            </ScrollView>
            {chips.atStart ? null : <EdgeFade side="left" />}
            {chips.atEnd ? null : <EdgeFade side="right" />}
          </View>
        )}

        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <Text style={styles.sectionMeta}>
            {view.dayEntries.length === 0 ? 'empty' : `${view.dayEntries.length} entries`}
          </Text>
        </View>

        <View accessible accessibilityLabel={describeMoney(expense)}>
          {view.dayEntries.length === 0 ? (
            <Text style={styles.timelineEmpty}>No entries on this day.</Text>
          ) : (
            view.dayEntries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                category={categoryLookup.get(entry.categoryId)}
                onLongPress={() => {
                  void removeEntry(entry.id);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <View style={[styles.fabSlot, { bottom: insets.bottom + 24 }]} pointerEvents="box-none">
        <FabFan actions={actions} />
      </View>
    </View>
  );
}

function buildWeek(date: string): string[] {
  const base = new Date(`${date}T00:00:00`);
  const day = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const cursor = new Date(monday);
    cursor.setDate(monday.getDate() + index);
    return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
      cursor.getDate(),
    ).padStart(2, '0')}`;
  });
}

function weekdayLabel(date: string): string {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(`${date}T00:00:00`).getDay()] ?? '?';
}

export const TODAY_PERIOD = monthKey(todayIso());

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  hero: {
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  heroLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: palette.inkMuted,
  },
  allowance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: palette.hairline,
  },
  allowanceLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  allowanceValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.body,
    color: palette.teal,
  },
  week: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 12,
  },
  weekCellActive: {
    backgroundColor: palette.ink,
  },
  weekDay: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    color: palette.inkMuted,
  },
  weekAmount: {
    fontFamily: fonts.heading,
    fontSize: fontSize.small,
    color: palette.ink,
  },
  weekDayActive: {
    color: palette.canvas,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  sectionMeta: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  chipsWrap: {
    marginHorizontal: -spacing.lg,
  },
  chips: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chipCard: {
    width: 108,
    gap: 6,
    padding: spacing.sm,
  },
  chipSwatch: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 10,
  },
  chipName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    color: palette.inkMuted,
  },
  chipAmount: {
    fontFamily: fonts.heading,
    fontSize: fontSize.small,
    color: palette.ink,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  timelineEmpty: {
    paddingVertical: spacing.lg,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  emptyCard: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  fabSlot: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
