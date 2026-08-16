export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO';

export type ExpiryValidationResult =
  | {
      valid: true;
      expiryMonth: string;
      expiryYear: string;
    }
  | {
      valid: false;
      message: string;
    };

const ELO_BIN_PREFIXES = [
  '401178',
  '401179',
  '431274',
  '438935',
  '451416',
  '457393',
  '457631',
  '457632',
  '504175',
  '506699',
  '509000',
  '627780',
  '636297',
  '636368',
  '636369',
  '650031',
  '650033',
  '650035',
  '650051',
  '650405',
  '650429',
  '650434',
  '650485',
  '650538',
  '650541',
  '650598',
  '650700',
  '650720',
  '650901',
  '651652',
  '651679',
  '655000',
  '655021',
  '655058',
] as const;

function digitsOnly(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, '');
  return maxLength === undefined ? digits : digits.slice(0, maxLength);
}

/** Formats up to 19 card digits into groups of four. */
export function formatCardNumber(value: string): string {
  const digits = digitsOnly(value, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Renders a progressive MM/AA mask from up to four numeric digits. */
export function formatExpiryMask(value: string): string {
  const digits = digitsOnly(value, 4);
  const month = `${digits.slice(0, 2)}__`.slice(0, 2);
  const year = `${digits.slice(2)}__`.slice(0, 2);

  return `${month}/${year}`;
}

/** Validates MM/AA and returns the MM/YYYY values required by the payment API. */
export function validateAndNormalizeExpiry(
  value: string,
  now = new Date(),
): ExpiryValidationResult {
  const digits = digitsOnly(value, 4);
  if (digits.length !== 4) {
    return { valid: false, message: 'Informe a validade no formato MM/AA.' };
  }

  const month = Number(digits.slice(0, 2));
  if (month < 1 || month > 12) {
    return { valid: false, message: 'Informe um mês entre 01 e 12.' };
  }

  const year = 2000 + Number(digits.slice(2));
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, message: 'O cartão está vencido.' };
  }

  return {
    valid: true,
    expiryMonth: String(month).padStart(2, '0'),
    expiryYear: String(year),
  };
}

/** Identifies the card brand accepted by LeraPay from a complete six-digit BIN. */
export function detectCardBrand(cardNumber: string): CardBrand | null {
  const digits = digitsOnly(cardNumber);
  if (digits.length < 6) {
    return null;
  }

  const bin = digits.slice(0, 6);
  if (ELO_BIN_PREFIXES.includes(bin as (typeof ELO_BIN_PREFIXES)[number])) {
    return 'ELO';
  }

  const firstTwoDigits = Number(digits.slice(0, 2));
  const firstFourDigits = Number(digits.slice(0, 4));
  if (
    (firstTwoDigits >= 51 && firstTwoDigits <= 55) ||
    (firstFourDigits >= 2221 && firstFourDigits <= 2720)
  ) {
    return 'MASTERCARD';
  }

  if (digits.startsWith('4')) {
    return 'VISA';
  }

  return null;
}
