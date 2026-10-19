import { StyleSheet } from 'react-native';

import { border, palette, radius, shadow } from './tokens';

/** Shared sticker surface used by cards, sheets and buttons. */
export const stickerSurface = StyleSheet.create({
  base: {
    backgroundColor: palette.surface,
    borderColor: palette.ink,
    borderWidth: border.thin,
    borderRadius: radius.card,
    boxShadow: shadow.card,
  },
  raised: {
    borderWidth: border.thick,
  },
});
