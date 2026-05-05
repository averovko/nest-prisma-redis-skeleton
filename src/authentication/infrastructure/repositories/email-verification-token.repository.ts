import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  EmailVerificationTokenRepositoryPort,
  CreateEmailVerificationTokenInput,
} from '../../domain/ports/email-verification-token.repository.port';
import { EmailVerificationToken } from '../../domain/entities/email-verification-token.entity';

@Injectable()
export class EmailVerificationTokenRepository implements EmailVerificationTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: CreateEmailVerificationTokenInput,
  ): Promise<EmailVerificationToken> {
    return this.prisma.client.emailVerificationToken.create({ data: input });
  }

  async findByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return this.prisma.client.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.client.emailVerificationToken.delete({ where: { id } });
  }

  async deleteAllByCredentialsId(credentialsId: string): Promise<void> {
    await this.prisma.client.emailVerificationToken.deleteMany({
      where: { credentialsId },
    });
  }
}
