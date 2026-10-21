import { describe, expect, it } from 'vitest';

import {
  addMoney,
  describeMoney,
  formatMoney,
  formatMoneyCompact,
  minorUnitFactor,
  money,
  parseAmount,
  subtractMoney,
  sumMoney,
} from '../src/money';

describe('money', () => {
  it('rejects fractional minor units', () => {
    expect(() => money(10.5)).toThrowError(/integer/);
  });

  it('exposes the correct scale for zero-exponent currencies', () => {
    expect(minorUnitFactor('JPY')).toBe(1);
    expect(minorUnitFactor('CNY')).toBe(100);
  });

  it('parses formatted input into minor units', () => {
    expect(parseAmount('12.34')).toEqual({ amountCents: 1234, currency: 'CNY' });
    expect(parseAmount('1,200')).toEqual({ amountCents: 120000, currency: 'CNY' });
    expect(parseAmount('')).toEqual({ amountCents: 0, currency: 'CNY' });
    expect(parseAmount('12.345')).toEqual({ amountCents: 1235, currency: 'CNY' });
  });

  it('keeps arithmetic inside one currency', () => {
    expect(addMoney(money(100), money(250)).amountCents).toBe(350);
    expect(subtractMoney(money(500), money(125)).amountCents).toBe(375);
    expect(sumMoney([money(100), money(200)]).amountCents).toBe(300);
    expect(() => addMoney(money(100, 'CNY'), money(100, 'USD'))).toThrowError(/mismatch/);
  });

  it('formats negative and symbol-free amounts', () => {
    expect(formatMoney(money(123456))).toBe('¥1,234.56');
    expect(formatMoney(money(-500), { withSymbol: false })).toBe('-5.00');
    expect(formatMoney(money(5000, 'JPY'), { showDecimals: false })).toBe('¥5,000');
  });

  it('describes amounts for screen readers', () => {
    expect(describeMoney(money(3250))).toBe('32 yuan 5 tenths');
    expect(describeMoney(money(10000))).toBe('100 yuan');
  });

  it('compacts huge amounts so tight cards cannot overflow', () => {
    expect(formatMoneyCompact(money(123456))).toBe('¥1,234.56');
    expect(formatMoneyCompact(money(12_345_600))).toBe('¥123.5K');
    expect(formatMoneyCompact(money(100_000_000_00))).toBe('¥100.0M');
    expect(formatMoneyCompact(money(-7_500_000_00), { withSymbol: false })).toBe('-7.5M');
  });
});
