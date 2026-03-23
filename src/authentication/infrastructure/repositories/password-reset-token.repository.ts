import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  PasswordResetTokenRepositoryPort,
  CreatePasswordResetTokenInput,
} from '../../domain/ports/password-reset-token.repository.port';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';

@Injectable()
export class PasswordResetTokenRepository implements PasswordResetTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: CreatePasswordResetTokenInput,
  ): Promise<PasswordResetToken> {
    return this.prisma.client.passwordResetToken.create({ data: input });
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.client.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.client.passwordResetToken.delete({ where: { id } });
  }

  async deleteAllByCredentialsId(credentialsId: string): Promise<void> {
    await this.prisma.client.passwordResetToken.deleteMany({
      where: { credentialsId },
    });
  }
}
