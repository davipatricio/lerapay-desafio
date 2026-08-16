/**
 * Central dashboard domain maps and small formatting helpers.
 *
 * Keeping status → { label, tone } lookups here (rather than in each page)
 * means every StatusBadge renders consistently, and a new status only needs
 * one entry to propagate across all tables/rows.
 */

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

/** Transaction / payment lifecycle statuses. */
export const TRANSACTION_STATUS: Record<string, StatusMeta> = {
  APPROVED: { label: 'Aprovada', tone: 'success' },
  PENDING: { label: 'Pendente', tone: 'warning' },
  PROCESSING: { label: 'Processando', tone: 'info' },
  DENIED: { label: 'Negada', tone: 'danger' },
  FAILED: { label: 'Falhou', tone: 'danger' },
  EXPIRED: { label: 'Expirada', tone: 'neutral' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' },
};

/** Checkout link lifecycle statuses. */
export const CHECKOUT_STATUS: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Ativo', tone: 'success' },
  COMPLETED: { label: 'Concluído', tone: 'info' },
  EXPIRED: { label: 'Expirado', tone: 'neutral' },
  INACTIVE: { label: 'Inativo', tone: 'neutral' },
};

/** Withdrawal lifecycle statuses. */
export const WITHDRAWAL_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: 'Pendente', tone: 'warning' },
  PROCESSING: { label: 'Processando', tone: 'info' },
  COMPLETED: { label: 'Concluído', tone: 'success' },
  FAILED: { label: 'Falhou', tone: 'danger' },
};

/** Payment method / transaction type metadata. */
export interface TransactionTypeMeta {
  label: string;
  shortLabel?: string;
  code: string;
  description?: string;
}

export const TRANSACTION_TYPES: Record<string, TransactionTypeMeta> = {
  PIX: {
    label: 'Pix',
    shortLabel: 'Pix',
    code: 'PIX',
    description: 'Pagamento instantâneo via Pix',
  },
  PAYMENT_PIX: {
    label: 'Pagamento Pix',
    shortLabel: 'Pix',
    code: 'PIX',
    description: 'Pagamento instantâneo via Pix',
  },
  CARD: {
    label: 'Cartão de Crédito',
    shortLabel: 'Cartão',
    code: 'CREDIT_CARD',
    description: 'Pagamento via Cartão de Crédito',
  },
  CREDIT_CARD: {
    label: 'Cartão de Crédito',
    shortLabel: 'Cartão',
    code: 'CREDIT_CARD',
    description: 'Pagamento via Cartão de Crédito',
  },
  PAYMENT_CARD: {
    label: 'Pagamento no Cartão',
    shortLabel: 'Cartão',
    code: 'CREDIT_CARD',
    description: 'Pagamento via Cartão de Crédito',
  },
  WITHDRAWAL: {
    label: 'Saque Pix',
    shortLabel: 'Saque',
    code: 'WITHDRAWAL',
    description: 'Transferência de saque para conta externa via Pix',
  },
};

/** Friendly labels for webhook events */
export const WEBHOOK_EVENT_LABELS: Record<string, string> = {
  PAYMENT_PIX: 'Pagamento Pix',
  PAYMENT_CARD: 'Pagamento no Cartão',
  WITHDRAWAL: 'Saque / Transferência',
};

/**
 * Resolves a webhook event key to a human-friendly label.
 */
export function getWebhookEventLabel(event?: string | null): string {
  if (!event) return '—';
  return WEBHOOK_EVENT_LABELS[event] ?? humanize(event);
}

/**
 * Resolves a raw transaction type string to a display label.
 */
export function getTransactionTypeMeta(type?: string | null): TransactionTypeMeta {
  if (!type) return { label: '—', code: 'UNKNOWN' };
  return TRANSACTION_TYPES[type] ?? { label: humanize(type), code: type };
}

/**
 * Convenience helper to get just the friendly label of a transaction type.
 */
export function getTransactionTypeLabel(type?: string | null): string {
  return getTransactionTypeMeta(type).label;
}

/** Aggregated map across all domains; unknown statuses fall back to neutral. */
export const STATUS_META: Record<string, StatusMeta> = {
  ...TRANSACTION_STATUS,
  ...CHECKOUT_STATUS,
  ...WITHDRAWAL_STATUS,
};

/**
 * Resolves a raw status string to a display label + semantic tone.
 * Unknown values are humanized (e.g. `AWAITING_CAPTURE` → `Awaiting capture`)
 * and rendered as neutral so the UI never shows a raw snake case token.
 */
export function getStatusMeta(status?: string | null): StatusMeta {
  if (!status) {
    return { label: '—', tone: 'neutral' };
  }
  return STATUS_META[status] ?? { label: humanize(status), tone: 'neutral' };
}

/**
 * Converts a snake_case / SCREAMING_SNAKE identifier into readable text:
 * `AWAITING_CAPTURE` → `Awaiting capture`.
 */
export function humanize(value: string): string {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/);

  return words
    .filter(Boolean)
    .map((w, i) => {
      const lower = w.toLowerCase();
      return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Formats an ISO timestamp as `DD/MM/YYYY`. */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
}

/** Formats an ISO timestamp as `DD/MM/YYYY HH:MM`. */
export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d);
}

/** Renders a copyable monospace reference, e.g. `ord_9f2c1a`. */
export function formatReference(reference?: string | null): string {
  if (!reference) return '—';
  return reference.length > 24 ? `${reference.slice(0, 20)}…` : reference;
}
