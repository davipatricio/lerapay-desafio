export interface UserMeResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  trading_name?: string;
  code_client: string;
  chave_loja: string;
  wallet_balance: number; // in centavos
}
