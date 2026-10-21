export type CurrencyCode = 'CNY' | 'USD' | 'EUR' | 'JPY';

export type Money = {
  readonly amountCents: number;
  readonly currency: CurrencyCode;
};

const MINOR_UNITS: Record<CurrencyCode, number> = {
  CNY: 2,
  USD: 2,
  EUR: 2,
  JPY: 0,
};

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/** JPY has no minor unit, so a zero exponent must collapse the scale factor to 1. */
export function minorUnitFactor(currency: CurrencyCode): number {
  return 10 ** MINOR_UNITS[currency];
}

export function money(amountCents: number, currency: CurrencyCode = 'CNY'): Money {
  if (!Number.isInteger(amountCents)) {
    throw new MoneyError('Amount must be an integer number of minor units');
  }
  return { amountCents, currency };
}

export function zeroMoney(currency: CurrencyCode = 'CNY'): Money {
  return money(0, currency);
}

/** Parses free-form user input such as "12.5" or "1,200" into minor units. */
export function parseAmount(input: string, currency: CurrencyCode = 'CNY'): Money {
  const normalized = input.replace(/[\s,]/g, '');
  if (normalized === '' || normalized === '.') {
    return zeroMoney(currency);
  }
  if (!/^\d*(\.\d*)?$/.test(normalized)) {
    throw new MoneyError(`Unsupported amount input: ${input}`);
  }
  const factor = minorUnitFactor(currency);
  const value = Number(normalized);
  return money(Math.round(value * factor), currency);
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountCents + b.amountCents, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountCents - b.amountCents, a.currency);
}

export function sumMoney(values: readonly Money[], currency: CurrencyCode = 'CNY'): Money {
  return values.reduce((total, value) => addMoney(total, value), zeroMoney(currency));
}

export function isNegative(value: Money): boolean {
  return value.amountCents < 0;
}

/** Formats minor units for display without relying on Intl locale data. */
export function formatMoney(
  value: Money,
  options: { withSymbol?: boolean; showDecimals?: boolean } = {},
): string {
  const { withSymbol = true, showDecimals = true } = options;
  const factor = minorUnitFactor(value.currency);
  const absolute = Math.abs(value.amountCents);
  const units = Math.floor(absolute / factor);
  const fraction = absolute % factor;
  const sign = value.amountCents < 0 ? '-' : '';
  const fractionText = showDecimals && factor > 1 ? `.${String(fraction).padStart(2, '0')}` : '';
  const body = `${sign}${units.toLocaleString('en-US')}${fractionText}`;
  if (!withSymbol) {
    return body;
  }
  return `${SYMBOLS[value.currency]}${body}`;
}

const COMPACT_STEPS = [
  { from: 1_000_000_000, divisor: 1_000_000_000, suffix: 'B' },
  { from: 1_000_000, divisor: 1_000_000, suffix: 'M' },
  { from: 10_000, divisor: 1_000, suffix: 'K' },
] as const;

const SYMBOLS: Record<CurrencyCode, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  JPY: '¥',
};

/**
 * Short form for tight containers. Large values collapse to K/M/B so a card
 * never grows past its fixed width.
 */
export function formatMoneyCompact(value: Money, options: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = options;
  const factor = minorUnitFactor(value.currency);
  const units = Math.abs(value.amountCents) / factor;
  const sign = value.amountCents < 0 ? '-' : '';
  const symbol = withSymbol ? SYMBOLS[value.currency] : '';
  const step = COMPACT_STEPS.find((candidate) => units >= candidate.from);

  if (step === undefined) {
    return formatMoney(value, { withSymbol });
  }

  const scaled = units / step.divisor;
  return `${sign}${symbol}${scaled.toFixed(1)}${step.suffix}`;
}

/** Screen readers should hear a spoken amount rather than raw symbols. */
export function describeMoney(value: Money): string {
  const factor = minorUnitFactor(value.currency);
  const units = Math.trunc(Math.abs(value.amountCents) / factor);
  const fraction = Math.abs(value.amountCents) % factor;
  const unitLabel = value.currency === 'JPY' ? 'yen' : 'yuan';
  const prefix = value.amountCents < 0 ? 'minus ' : '';
  if (fraction === 0 || factor === 1) {
    return `${prefix}${units} ${unitLabel}`;
  }
  const tenths = Math.round((fraction / factor) * 10);
  return `${prefix}${units} ${unitLabel} ${tenths} tenths`;
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}
