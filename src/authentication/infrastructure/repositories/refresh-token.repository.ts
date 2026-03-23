import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  RefreshTokenRepositoryPort,
  CreateRefreshTokenInput,
} from '../../domain/ports/refresh-token.repository.port';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.prisma.client.refreshToken.create({ data: input });
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.client.refreshToken.findUnique({ where: { tokenHash } });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.client.refreshToken.delete({ where: { id } });
  }

  async deleteAllByCredentialsId(credentialsId: string): Promise<void> {
    await this.prisma.client.refreshToken.deleteMany({
      where: { credentialsId },
    });
  }
}
