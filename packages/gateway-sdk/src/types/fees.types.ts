export interface GetFeesResponse {
  brand: 'VISA' | 'MASTERCARD' | 'ELO';
  installments: number;
  feePercent: number;
}

export interface FeeTableItem {
  brand: 'VISA' | 'MASTERCARD' | 'ELO';
  installments: number;
  feePercent: number;
}
