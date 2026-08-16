import { describe, it, expect } from 'vitest';
import {
  formatCep,
  formatPhone,
  formatCpf,
  formatCnpj,
  formatDocument,
  stripNonDigits,
} from './formatters';

describe('stripNonDigits', () => {
  it('removes non-numeric characters', () => {
    expect(stripNonDigits('123.456-78')).toBe('12345678');
    expect(stripNonDigits('(11) 98765-4321')).toBe('11987654321');
    expect(stripNonDigits(null)).toBe('');
    expect(stripNonDigits(undefined)).toBe('');
  });
});

describe('formatCep', () => {
  it('formats partial and complete CEPs (NNNNN-NNN)', () => {
    expect(formatCep('')).toBe('');
    expect(formatCep('0')).toBe('0');
    expect(formatCep('01001')).toBe('01001');
    expect(formatCep('010010')).toBe('01001-0');
    expect(formatCep('01001000')).toBe('01001-000');
    expect(formatCep('01001-000')).toBe('01001-000');
    expect(formatCep('010010009999')).toBe('01001-000');
  });
});

describe('formatPhone', () => {
  it('formats progressive BR phone numbers up to 10 digits (landline)', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone('1')).toBe('(1');
    expect(formatPhone('11')).toBe('(11');
    expect(formatPhone('112')).toBe('(11) 2');
    expect(formatPhone('112345')).toBe('(11) 2345');
    expect(formatPhone('1123456')).toBe('(11) 2345-6');
    expect(formatPhone('1123456789')).toBe('(11) 2345-6789');
  });

  it('formats 11 digits (mobile phone with 9th digit)', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
    expect(formatPhone('11987654321999')).toBe('(11) 98765-4321');
  });
});

describe('formatCpf', () => {
  it('formats progressive CPFs (000.000.000-00)', () => {
    expect(formatCpf('')).toBe('');
    expect(formatCpf('123')).toBe('123');
    expect(formatCpf('1234')).toBe('123.4');
    expect(formatCpf('123456')).toBe('123.456');
    expect(formatCpf('1234567')).toBe('123.456.7');
    expect(formatCpf('123456789')).toBe('123.456.789');
    expect(formatCpf('1234567890')).toBe('123.456.789-0');
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
    expect(formatCpf('12345678901999')).toBe('123.456.789-01');
  });
});

describe('formatCnpj', () => {
  it('formats progressive CNPJs (00.000.000/0001-00)', () => {
    expect(formatCnpj('')).toBe('');
    expect(formatCnpj('12')).toBe('12');
    expect(formatCnpj('123')).toBe('12.3');
    expect(formatCnpj('12345')).toBe('12.345');
    expect(formatCnpj('123456')).toBe('12.345.6');
    expect(formatCnpj('12345678')).toBe('12.345.678');
    expect(formatCnpj('123456780001')).toBe('12.345.678/0001');
    expect(formatCnpj('1234567800019')).toBe('12.345.678/0001-9');
    expect(formatCnpj('12345678000195')).toBe('12.345.678/0001-95');
    expect(formatCnpj('123456780001959999')).toBe('12.345.678/0001-95');
  });
});

describe('formatDocument', () => {
  it('formats based on personType PF / PJ or auto-detection', () => {
    expect(formatDocument('12345678901', 'PF')).toBe('123.456.789-01');
    expect(formatDocument('12345678000195', 'PJ')).toBe('12.345.678/0001-95');
    expect(formatDocument('12345678901')).toBe('123.456.789-01');
    expect(formatDocument('12345678000195')).toBe('12.345.678/0001-95');
  });
});
