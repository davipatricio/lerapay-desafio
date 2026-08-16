/**
 * Brazilian document, phone, and postal code formatting utilities.
 */

/**
 * Strips all non-digit characters from an input string.
 */
export function stripNonDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * Formats an 8-digit Brazilian postal code (CEP) into `NNNNN-NNN`.
 * Handles progressive input up to 8 numeric digits.
 */
export function formatCep(value: string): string {
  const digits = stripNonDigits(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Formats a Brazilian telephone number (landline or mobile).
 * - Up to 10 digits: `(XX) XXXX-XXXX`
 * - 11 digits: `(XX) XXXXX-XXXX`
 * Progressively masks as the user types.
 */
export function formatPhone(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Formats an 11-digit Brazilian CPF into `000.000.000-00`.
 * Progressively masks as the user types.
 */
export function formatCpf(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formats a 14-digit Brazilian CNPJ into `00.000.000/0001-00`.
 * Progressively masks as the user types.
 */
export function formatCnpj(value: string): string {
  const digits = stripNonDigits(value).slice(0, 14);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Formats a document string as either CPF or CNPJ based on explicit person type
 * or auto-detected digit length.
 */
export function formatDocument(value: string, personType?: 'PF' | 'PJ'): string {
  const digits = stripNonDigits(value);
  if (personType === 'PJ') {
    return formatCnpj(digits);
  }
  if (personType === 'PF') {
    return formatCpf(digits);
  }
  return digits.length > 11 ? formatCnpj(digits) : formatCpf(digits);
}
