import { BadRequestException, Injectable } from '@nestjs/common';
import type { FeeTableItem, GetFeesParams } from '@lerapay/gateway-sdk';
import { GatewayService } from '../gateway/gateway.service';

@Injectable()
export class FeesService {
  constructor(private readonly gatewayService: GatewayService) {}

  public async getFees(params?: GetFeesParams): Promise<FeeTableItem[]> {
    const res = await this.gatewayService.getFees(params);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).fees)) return (res as any).fees;
    return [];
  }

  public async validateFee(
    brand: 'VISA' | 'MASTERCARD' | 'ELO',
    installments: number,
    feePercent: number,
  ): Promise<FeeTableItem> {
    const fees = await this.getFees({ brand });
    const feeItem = fees.find(
      (f) =>
        f.brand.toUpperCase() === brand.toUpperCase() &&
        Number(f.installments) === Number(installments),
    );

    if (!feeItem) {
      throw new BadRequestException(
        `Installment ${installments}x is not supported for brand ${brand}`,
      );
    }

    // Allow floating point comparison with a small epsilon
    if (Math.abs(Number(feeItem.feePercent) - Number(feePercent)) > 0.01) {
      throw new BadRequestException(
        `Invalid feePercent ${feePercent}%. Expected ${feeItem.feePercent}% for ${brand} ${installments}x per gateway fee table.`,
      );
    }

    return feeItem;
  }
}
