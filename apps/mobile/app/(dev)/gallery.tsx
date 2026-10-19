import { useState } from 'react';

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { money } from '@ledgerflow/core';
import {
  accents,
  AmountText,
  Button,
  Card,
  Chip,
  EmptyState,
  FabFan,
  fonts,
  fontSize,
  Icon,
  ICON_NAMES,
  palette,
  radius,
  spacing,
  SyncBadge,
} from '@ledgerflow/ui';
import type { FanAction } from '@ledgerflow/ui';

const TYPE_SCALE = [
  { label: 'Hero', size: fontSize.hero },
  { label: 'Display', size: fontSize.display },
  { label: 'H1', size: fontSize.h1 },
  { label: 'H2', size: fontSize.h2 },
  { label: 'Body', size: fontSize.body },
  { label: 'Small', size: fontSize.small },
] as const;

/** Development-only surface for checking tokens, states and icon coverage. */
export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('coral');

  const actions: readonly [FanAction, FanAction, FanAction] = [
    { key: 'a', label: 'Expense', icon: 'plus', accent: palette.coral, onPress: () => undefined },
    {
      key: 'b',
      label: 'Income',
      icon: 'arrow-down-left',
      accent: palette.gold,
      onPress: () => undefined,
    },
    { key: 'c', label: 'Budget', icon: 'target', accent: palette.teal, onPress: () => undefined },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.heading}>Design gallery</Text>
      <Text style={styles.caption}>Sticker tokens, primitives and icon set.</Text>

      <Text style={styles.section}>Palette</Text>
      <View style={styles.swatches}>
        {Object.entries(palette).map(([name, color]) => (
          <View key={name} style={styles.swatch}>
            <View style={[styles.swatchChip, { backgroundColor: color }]} />
            <Text style={styles.swatchLabel}>{name}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Type</Text>
      <Card tone="surface">
        {TYPE_SCALE.map((item) => (
          <Text key={item.label} style={[styles.typeRow, { fontSize: item.size }]}>
            {item.label} {item.size}
          </Text>
        ))}
        <AmountText value={money(123456)} size="display" />
      </Card>

      <Text style={styles.section}>Buttons</Text>
      <View style={styles.row}>
        <Button label="Coral" tone="coral" onPress={() => undefined} />
        <Button label="Gold" tone="gold" onPress={() => undefined} />
        <Button label="Teal" tone="teal" onPress={() => undefined} />
        <Button label="Ink" tone="ink" onPress={() => undefined} />
        <Button label="Ghost" tone="ghost" onPress={() => undefined} />
        <Button label="Disabled" disabled onPress={() => undefined} />
      </View>

      <Text style={styles.section}>Chips</Text>
      <View style={styles.row}>
        {accents.map((accent, index) => (
          <Chip
            key={accent}
            label={`Option ${index + 1}`}
            emoji="🍜"
            accent={accent}
            selected={selected === accent}
            onPress={() => setSelected(accent)}
          />
        ))}
      </View>

      <Text style={styles.section}>States</Text>
      <EmptyState
        emoji="🧾"
        title="Nothing logged"
        hint="Quick add keeps the first entry under three taps."
      />
      <SyncBadge offline pendingCount={4} />

      <Text style={styles.section}>Fab fan</Text>
      <View style={styles.fabStage}>
        <FabFan actions={actions} />
      </View>

      <Text style={styles.section}>Icons</Text>
      <View style={styles.iconGrid}>
        {ICON_NAMES.map((name) => (
          <View key={name} style={styles.iconCell}>
            <Icon name={name} size={22} color={palette.ink} />
            <Text style={styles.iconLabel}>{name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    color: palette.ink,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  section: {
    marginTop: spacing.lg,
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    alignItems: 'center',
    gap: 4,
    width: 72,
  },
  swatchChip: {
    width: 56,
    height: 40,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: radius.button,
  },
  swatchLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: palette.inkMuted,
  },
  typeRow: {
    fontFamily: fonts.heading,
    color: palette.ink,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fabStage: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconCell: {
    alignItems: 'center',
    gap: 4,
    width: 84,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: palette.hairline,
    borderRadius: radius.button,
  },
  iconLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: palette.inkMuted,
  },
});
