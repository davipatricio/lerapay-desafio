import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
      relations: { gatewayAccount: true },
    });
  }

  public async findByDocument(document: string): Promise<User | null> {
    const cleanDoc = document.replace(/\D/g, '');
    return this.userRepository.findOne({
      where: { document: cleanDoc },
      relations: { gatewayAccount: true },
    });
  }

  public async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { gatewayAccount: true },
    });
  }

  public async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create({
      ...data,
      email: data.email?.toLowerCase().trim(),
      document: data.document?.replace(/\D/g, ''),
    });
    return this.userRepository.save(user);
  }
}
