import { BranchPayError } from '@lerapay/gateway-sdk';

export const GATEWAY_REAUTH_REQUIRED = 'GATEWAY_REAUTH_REQUIRED';
export const GATEWAY_REAUTH_MESSAGE =
  'A sessão do gateway expirou. Informe novamente a senha recebida por e-mail para reautenticar sua conta.';

export function isGatewayTokenRejection(error: unknown): boolean {
  if (!(error instanceof BranchPayError) || error.status !== 401) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('token') &&
    (message.includes('inválido') ||
      message.includes('expirado') ||
      message.includes('invalid') ||
      message.includes('expired'))
  );
}
