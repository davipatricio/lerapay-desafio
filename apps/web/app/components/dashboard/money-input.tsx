'use client';

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';

export interface MoneyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'defaultValue'
> {
  /** Current value in centavos (integer). */
  value: number;
  /** Called with the new value in centavos on every keystroke. */
  onValueChange: (centavos: number) => void;
}

/**
 * Money field that keeps a centavos integer as its source of truth but shows a
 * formatted BRL value while typing (e.g. `1250` → `R$ 12,50`). Digits typed at
 * the end of the field shift the decimal point right, so typing `1 2 5 0` reads
 * `R$ 0,01 → R$ 0,12 → R$ 1,25 → R$ 12,50`. No floating point, no manual parse.
 */
export function MoneyInput({
  value,
  onValueChange,
  onFocus,
  onBlur,
  className,
  placeholder = '0,00',
  ...props
}: MoneyInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const display = focused ? (draft ?? formatBRL(value)) : value > 0 ? formatBRL(value) : '';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    const centavos = digits ? parseInt(digits, 10) : 0;
    setDraft(formatBRL(centavos));
    onValueChange(centavos);
  };

  return (
    <Input
      inputMode="numeric"
      autoComplete="off"
      className={cn('font-mono tabular-nums', className)}
      placeholder={placeholder}
      {...props}
      value={display}
      onChange={handleChange}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        setDraft(null);
        onBlur?.(event);
      }}
    />
  );
}
