import { describe, expect, it } from 'vitest';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiryMask,
  validateAndNormalizeExpiry,
} from './card-payment';

describe('formatCardNumber', () => {
  it('groups digits in blocks of four', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('keeps up to 19 digits so formatting matches submit validation', () => {
    expect(formatCardNumber('6362971234567890123456')).toBe('6362 9712 3456 7890 123');
  });

  it('ignores non-digit characters', () => {
    expect(formatCardNumber('4111-abc-1111')).toBe('4111 1111');
  });
});

describe('formatExpiryMask', () => {
  it('renders the progressive placeholder while the customer types', () => {
    expect(formatExpiryMask('')).toBe('__/__');
    expect(formatExpiryMask('0')).toBe('0_/__');
    expect(formatExpiryMask('03')).toBe('03/__');
    expect(formatExpiryMask('033')).toBe('03/3_');
    expect(formatExpiryMask('0330')).toBe('03/30');
  });

  it('normalizes pasted values that already contain separators or spaces', () => {
    expect(formatExpiryMask('03/30')).toBe('03/30');
    expect(formatExpiryMask(' 03 / 30 ')).toBe('03/30');
  });

  it('caps input at four digits', () => {
    expect(formatExpiryMask('0330999')).toBe('03/30');
  });
});

describe('validateAndNormalizeExpiry', () => {
  const now = new Date('2026-08-16T12:00:00.000Z');

  it('accepts the current month', () => {
    expect(validateAndNormalizeExpiry('0826', now)).toEqual({
      valid: true,
      expiryMonth: '08',
      expiryYear: '2026',
    });
  });

  it('accepts a future date and serializes MM and YYYY', () => {
    expect(validateAndNormalizeExpiry('0330', now)).toEqual({
      valid: true,
      expiryMonth: '03',
      expiryYear: '2030',
    });
  });

  it('normalizes a masked value before validating', () => {
    expect(validateAndNormalizeExpiry('03/30', now)).toEqual({
      valid: true,
      expiryMonth: '03',
      expiryYear: '2030',
    });
  });

  it('rejects incomplete input', () => {
    expect(validateAndNormalizeExpiry('03', now)).toEqual({
      valid: false,
      message: 'Informe a validade no formato MM/AA.',
    });
    expect(validateAndNormalizeExpiry('', now)).toEqual({
      valid: false,
      message: 'Informe a validade no formato MM/AA.',
    });
  });

  it('rejects months outside 01-12', () => {
    expect(validateAndNormalizeExpiry('0030', now)).toEqual({
      valid: false,
      message: 'Informe um mês entre 01 e 12.',
    });
    expect(validateAndNormalizeExpiry('1330', now)).toEqual({
      valid: false,
      message: 'Informe um mês entre 01 e 12.',
    });
  });

  it('rejects an earlier month in the current year', () => {
    expect(validateAndNormalizeExpiry('0726', now)).toEqual({
      valid: false,
      message: 'O cartão está vencido.',
    });
  });

  it('rejects a previous year', () => {
    expect(validateAndNormalizeExpiry('1225', now)).toEqual({
      valid: false,
      message: 'O cartão está vencido.',
    });
  });
});

describe('detectCardBrand', () => {
  it('detects Visa', () => {
    expect(detectCardBrand('4111 1111 1111 1111')).toBe('VISA');
  });

  it('detects legacy Mastercard prefixes', () => {
    expect(detectCardBrand('5100000000000000')).toBe('MASTERCARD');
    expect(detectCardBrand('5599999999999999')).toBe('MASTERCARD');
  });

  it('detects the Mastercard 2-series range boundaries', () => {
    expect(detectCardBrand('2221000000000000')).toBe('MASTERCARD');
    expect(detectCardBrand('2720999999999999')).toBe('MASTERCARD');
  });

  it('excludes values just outside the Mastercard 2-series range', () => {
    expect(detectCardBrand('2220000000000000')).toBeNull();
    expect(detectCardBrand('2721000000000000')).toBeNull();
  });

  it('prefers Elo over Visa for Elo BINs that start with 4', () => {
    expect(detectCardBrand('4011780000000000')).toBe('ELO');
    expect(detectCardBrand('4514160000000000')).toBe('ELO');
  });

  it('detects Elo BINs outside the Visa range', () => {
    expect(detectCardBrand('6362970000000000')).toBe('ELO');
  });

  it('returns null while the BIN is incomplete', () => {
    expect(detectCardBrand('4111')).toBeNull();
    expect(detectCardBrand('')).toBeNull();
  });

  it('never falls back to Visa for an unsupported BIN', () => {
    expect(detectCardBrand('3400000000000')).toBeNull();
    expect(detectCardBrand('6011000000000000')).toBeNull();
  });
});
