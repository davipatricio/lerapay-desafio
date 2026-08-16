export interface CreateUserDto {
  personType: 'PF' | 'PJ';
  name: string;
  tradingName?: string;
  email: string;
  phone: string;
  document: string;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface LoginDto {
  document: string;
  password: string;
}

export interface ResetPasswordDto {
  document: string;
  email: string;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
}

export interface LoginResponse {
  access_token: string;
  code_client: string;
  chave_loja: string;
  expires_in: number;
  refresh_token?: string;
}
