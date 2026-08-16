/**
 * Formats a monetary value in centavos (integer) into a BRL string.
 */
export function formatBRL(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formats a cents value as a compact number string (e.g. "45.230").
 */
export function formatCents(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR');
}
