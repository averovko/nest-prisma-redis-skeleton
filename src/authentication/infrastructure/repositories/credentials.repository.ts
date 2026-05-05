import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CredentialsRepositoryPort,
  CreateCredentialsInput,
} from '../../domain/ports/credentials.repository.port';
import { Credentials } from '../../domain/entities/credentials.entity';

@Injectable()
export class CredentialsRepository implements CredentialsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCredentialsInput): Promise<Credentials> {
    return this.prisma.client.credentials.create({ data: input });
  }

  async findById(id: string): Promise<Credentials | null> {
    return this.prisma.client.credentials.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Credentials | null> {
    return this.prisma.client.credentials.findUnique({ where: { email } });
  }

  async findByAuthId(authId: string): Promise<Credentials | null> {
    return this.prisma.client.credentials.findUnique({ where: { authId } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.client.credentials.count({
      where: { email },
    });
    return count > 0;
  }

  async updatePasswordHash(
    authId: string,
    newPasswordHash: string,
  ): Promise<Credentials> {
    return this.prisma.client.credentials.update({
      where: { authId },
      data: { passwordHash: newPasswordHash },
    });
  }

  async markAsVerified(authId: string): Promise<Credentials> {
    return this.prisma.client.credentials.update({
      where: { authId },
      data: { isVerified: true },
    });
  }
}
