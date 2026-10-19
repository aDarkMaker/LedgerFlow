/** Sticker design tokens: thick ink borders, hard offset shadows, no blur. */
export const palette = {
  canvas: '#FFF6E9',
  surface: '#FFFFFF',
  surfaceMuted: '#FFF1DC',
  ink: '#311703',
  inkMuted: '#8A7361',
  inkSoft: '#C4B4A3',
  hairline: '#EADDCB',
  coral: '#FF7F50',
  gold: '#FFD700',
  teal: '#019B98',
  sky: '#4DA3FF',
  lilac: '#B18CFF',
  lime: '#7ED957',
  blush: '#FF8FB1',
  danger: '#E5484D',
  positive: '#019B98',
  onAccent: '#311703',
} as const;

export const accents = [
  palette.coral,
  palette.gold,
  palette.teal,
  palette.sky,
  palette.lilac,
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  chip: 999,
  button: 14,
  card: 18,
  sheet: 24,
} as const;

export const border = {
  thin: 2,
  thick: 3,
} as const;

/** Hard offset shadows emulate a printed sticker; blur would break the look. */
export const shadow = {
  card: '0px 3px 0px #311703',
  button: '0px 3px 0px #311703',
  pressed: '0px 1px 0px #311703',
  lifted: '0px 5px 0px #311703',
  none: 'none',
} as const;

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  heading: 'BricolageGrotesque_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const fontSize = {
  hero: 52,
  display: 34,
  h1: 26,
  h2: 20,
  body: 15,
  small: 13,
  caption: 11,
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
} as const;

export const motion = {
  fan: { stiffness: 220, damping: 18, mass: 0.8 },
  amount: { stiffness: 160, damping: 22 },
  press: 120,
  stagger: 40,
} as const;

export const theme = {
  palette,
  accents,
  spacing,
  radius,
  border,
  shadow,
  fonts,
  fontSize,
  lineHeight,
  motion,
} as const;

export type Theme = typeof theme;
