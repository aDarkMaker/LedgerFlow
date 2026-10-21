import { Image, StyleSheet, View } from 'react-native';

import { palette } from '@ledgerflow/ui';

import { mediaUri } from '@/lib/media';
import { useLedgerStore } from '@/state/ledger-store';

/** Sits behind the tab scenes; the scrim keeps body copy readable. */
export function Wallpaper() {
  const fileName = useLedgerStore((state) => state.profile.wallpaperFileName);
  const uri = mediaUri(fileName);

  if (uri === null) {
    return <View style={[StyleSheet.absoluteFill, styles.canvas]} />;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: palette.canvas,
  },
  scrim: {
    backgroundColor: 'rgba(255, 246, 233, 0.82)',
  },
});
