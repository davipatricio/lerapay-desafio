import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutLink } from './entities/checkout-link.entity';
import type { CreateCheckoutLinkDto } from './dto/create-checkout-link.dto';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutLink)
    private readonly checkoutLinkRepository: Repository<CheckoutLink>,
  ) {}

  public async create(userId: string, dto: CreateCheckoutLinkDto): Promise<CheckoutLink> {
    const externalReference =
      dto.externalReference?.trim() ||
      `CHK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const link = this.checkoutLinkRepository.create({
      userId,
      title: dto.title.trim(),
      amount: dto.amount,
      allowedMethods: dto.allowedMethods || ['PIX', 'CREDIT_CARD'],
      maxInstallments: dto.maxInstallments ?? 12,
      externalReference,
      status: 'ACTIVE',
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    return this.checkoutLinkRepository.save(link);
  }

  public async findAllByUser(userId: string): Promise<CheckoutLink[]> {
    return this.checkoutLinkRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  public async findById(id: string): Promise<CheckoutLink> {
    const link = await this.checkoutLinkRepository.findOne({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException(`Link de checkout não encontrado para o ID: ${id}`);
    }

    return link;
  }

  public async findByExternalReference(externalReference: string): Promise<CheckoutLink | null> {
    return this.checkoutLinkRepository.findOne({
      where: { externalReference },
      relations: { user: true },
    });
  }

  public async updateStatus(
    id: string,
    status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED',
  ): Promise<CheckoutLink> {
    const link = await this.findById(id);
    link.status = status;
    return this.checkoutLinkRepository.save(link);
  }
}
