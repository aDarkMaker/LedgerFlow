import { useState } from 'react';

import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { border, Card, fonts, fontSize, Icon, palette, radius, spacing } from '@ledgerflow/ui';

import { AccountCard } from '@/components/account-card';
import { BudgetCard } from '@/components/budget-card';
import { ScreenHeader } from '@/components/screen-header';
import { mediaUri, persistImage, pickImage } from '@/lib/media';
import { useLedgerStore } from '@/state/ledger-store';

const ANIM_MS = 200;
const WALLPAPER_FILE = 'wallpaper.jpg';

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const wallpaperFileName = useLedgerStore((state) => state.profile.wallpaperFileName);
  const updateProfile = useLedgerStore((state) => state.updateProfile);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const expanded = useSharedValue(0);
  const bodyHeight = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expanded.value, [0, 1], [0, 90])}deg` }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    height: interpolate(expanded.value, [0, 1], [0, bodyHeight.value]),
    opacity: expanded.value,
  }));

  const wallpaper = mediaUri(wallpaperFileName);
  const version = Constants.expoConfig?.version ?? '0.1.0';

  function toggle() {
    setOpen((current) => {
      expanded.set(
        withTiming(current ? 0 : 1, { duration: ANIM_MS, easing: Easing.out(Easing.cubic) }),
      );
      return !current;
    });
  }

  async function chooseWallpaper() {
    try {
      const picked = await pickImage([9, 16]);
      if (picked === null) {
        return;
      }
      await updateProfile({ wallpaperFileName: await persistImage(picked, WALLPAPER_FILE) });
      setMessage('Background updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load that photo');
    }
  }

  async function clearWallpaper() {
    await updateProfile({ wallpaperFileName: null });
    setMessage('Background cleared.');
  }

  async function checkUpdates() {
    if (!Updates.isEnabled) {
      setMessage('Updates only run in installed builds.');
      return;
    }
    setBusy(true);
    try {
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        setMessage('You are on the latest version.');
        return;
      }
      await Updates.fetchUpdateAsync();
      setMessage('Update downloaded. Restarting...');
      await Updates.reloadAsync();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Update check failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader eyebrow="Settings" title="Your ledger" />

        <AccountCard />

        <Card tone="surface" style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="piggy-bank" size={18} color={palette.ink} />
            <Text style={styles.cardTitle}>Budget</Text>
          </View>
          <BudgetCard />
        </Card>

        <Card tone="muted" style={styles.advanced}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Advanced settings"
            accessibilityState={{ expanded: open }}
            onPress={toggle}
            style={styles.advancedHeader}
          >
            <View style={styles.cardHeader}>
              <Icon name="sliders-horizontal" size={18} color={palette.ink} />
              <Text style={styles.cardTitle}>Advanced</Text>
            </View>
            <Animated.View style={chevronStyle}>
              <Icon name="chevron-right" size={18} color={palette.ink} />
            </Animated.View>
          </Pressable>

          <Animated.View style={[styles.collapsible, bodyStyle]}>
            <View
              onLayout={(event) => {
                bodyHeight.set(event.nativeEvent.layout.height);
              }}
              style={styles.advancedBody}
            >
              <View style={styles.block}>
                <View style={styles.blockHeader}>
                  <View style={styles.blockHeaderLeft}>
                    <Icon name="sparkles" size={16} color={palette.inkMuted} />
                    <Text style={styles.blockTitle}>Background</Text>
                  </View>
                  {wallpaper === null ? null : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear background"
                      hitSlop={10}
                      onPress={() => void clearWallpaper()}
                    >
                      <Text style={styles.linkMuted}>Reset</Text>
                    </Pressable>
                  )}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={wallpaper === null ? 'Add background' : 'Change background'}
                  onPress={() => void chooseWallpaper()}
                  style={({ pressed }) => [
                    styles.preview,
                    wallpaper === null && styles.previewEmptyFrame,
                    pressed && styles.previewPressed,
                  ]}
                >
                  {wallpaper === null ? (
                    <View style={styles.previewEmpty}>
                      <Icon name="plus" size={18} color={palette.inkSoft} />
                      <Text style={styles.previewEmptyLabel}>Add a photo</Text>
                    </View>
                  ) : (
                    <>
                      <Image source={{ uri: wallpaper }} style={styles.previewImage} />
                      <View style={styles.previewBadge}>
                        <Text style={styles.previewBadgeLabel}>Change</Text>
                      </View>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.block}>
                <View style={styles.blockHeader}>
                  <View style={styles.blockHeaderLeft}>
                    <Icon name="cloud-upload" size={16} color={palette.inkMuted} />
                    <Text style={styles.blockTitle}>About</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>LedgerFlow</Text>
                  <Text style={styles.infoValue}>v{version}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.updateRow}>
                  <Text style={styles.updateHint}>Local first · updates over the air</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Check for updates"
                    accessibilityState={{ disabled: busy }}
                    disabled={busy}
                    onPress={() => void checkUpdates()}
                    style={({ pressed }) => [styles.chip, (pressed || busy) && styles.chipPressed]}
                  >
                    <Text style={styles.chipLabel}>{busy ? 'Checking' : 'Check'}</Text>
                    <Icon name="chevron-right" size={13} color={palette.ink} strokeWidth={2.4} />
                  </Pressable>
                </View>
              </View>

              {message === null ? null : <Text style={styles.message}>{message}</Text>}
            </View>
          </Animated.View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.h2,
    color: palette.ink,
  },
  advanced: {
    gap: spacing.md,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsible: {
    overflow: 'hidden',
  },
  advancedBody: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  block: {
    gap: spacing.sm,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  blockTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: palette.inkMuted,
  },
  linkMuted: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  preview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 96,
    overflow: 'hidden',
    backgroundColor: palette.canvas,
    borderWidth: border.thin,
    borderColor: palette.ink,
    borderRadius: radius.card,
  },
  previewEmptyFrame: {
    borderStyle: 'dashed',
    borderColor: palette.inkSoft,
  },
  previewPressed: {
    opacity: 0.7,
  },
  previewEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewEmptyLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: palette.surface,
    borderWidth: border.thin,
    borderColor: palette.ink,
    borderRadius: radius.chip,
  },
  previewBadgeLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    color: palette.ink,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.body,
    color: palette.ink,
  },
  infoValue: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: palette.hairline,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  updateHint: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.surface,
    borderWidth: border.thin,
    borderColor: palette.ink,
    borderRadius: radius.chip,
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    color: palette.ink,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: palette.inkMuted,
  },
});
