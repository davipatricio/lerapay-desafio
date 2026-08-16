import * as React from 'react';

import { cn } from '@/lib/utils';
import { getTransactionTypeMeta } from '@/lib/dashboard';
import { QrCode, CreditCard, ArrowUpRight, HelpCircle } from 'lucide-react';

export interface TransactionTypeBadgeProps extends React.ComponentProps<'div'> {
  /** Raw transaction type string, e.g. 'PIX', 'CREDIT_CARD', 'WITHDRAWAL'. */
  type?: string | null;
  /** Display style: 'inline' (icon + text) or 'badge' (contained pill). */
  variant?: 'inline' | 'badge';
  /** Render the type icon alongside the text. */
  showIcon?: boolean;
}

/**
 * Renders a friendly transaction type label (e.g. "Pix", "Cartão de Crédito", "Saque Pix")
 * with a corresponding semantic icon and accessible color styling.
 */
export function TransactionTypeBadge({
  type,
  variant = 'inline',
  showIcon = true,
  className,
  ...props
}: TransactionTypeBadgeProps) {
  const meta = getTransactionTypeMeta(type);
  const raw = (type || '').toUpperCase();

  const icon = (() => {
    if (raw === 'PIX' || raw === 'PAYMENT_PIX') {
      return <QrCode className="size-3.5 shrink-0 text-emerald-500" />;
    }
    if (raw === 'CREDIT_CARD' || raw === 'CARD' || raw === 'PAYMENT_CARD') {
      return <CreditCard className="size-3.5 shrink-0 text-sky-500" />;
    }
    if (raw === 'WITHDRAWAL') {
      return <ArrowUpRight className="size-3.5 shrink-0 text-amber-500" />;
    }
    return <HelpCircle className="size-3.5 shrink-0 text-muted-foreground" />;
  })();

  if (variant === 'badge') {
    return (
      <span
        data-slot="transaction-type-badge"
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
          raw === 'PIX' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
          (raw === 'CREDIT_CARD' || raw === 'CARD' || raw === 'PAYMENT_CARD') &&
            'bg-sky-500/10 text-sky-700 dark:text-sky-300',
          raw === 'WITHDRAWAL' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
          !['PIX', 'CREDIT_CARD', 'CARD', 'PAYMENT_CARD', 'WITHDRAWAL'].includes(raw) &&
            'bg-muted text-muted-foreground',
          className,
        )}
        {...props}
      >
        {showIcon && icon}
        <span>{meta.label}</span>
      </span>
    );
  }

  return (
    <div
      data-slot="transaction-type-inline"
      className={cn('flex items-center gap-1.5', className)}
      {...props}
    >
      {showIcon && icon}
      <span className="text-xs font-medium">{meta.label}</span>
    </div>
  );
}
