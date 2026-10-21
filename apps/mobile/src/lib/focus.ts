import { Platform } from 'react-native';

type Focusable = {
  activeElement: { blur: () => void } | null;
};

/** Drops focus before a screen is aria-hidden so assistive tech is not trapped. */
export function blurActiveElement(): void {
  if (Platform.OS !== 'web') {
    return;
  }
  const doc = (globalThis as { document?: Focusable }).document;
  doc?.activeElement?.blur();
}
