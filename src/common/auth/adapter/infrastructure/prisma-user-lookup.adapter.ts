import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

import { type User, Role } from '../../domain';
import { type UserLookupPort } from '../../application';

@Injectable()
export class PrismaUserLookupAdapter implements UserLookupPort {
  constructor(private readonly prismaService: PrismaService) {}

  async findByAuthId(authId: string): Promise<User | undefined> {
    const prismaUser = await this.prismaService.client.user.findUnique({
      where: { authId },
    });
    if (!prismaUser) {
      return undefined;
    }
    return this.toDomainUser(prismaUser);
  }

  private toDomainUser(prismaUser: {
    id: string;
    authId: string;
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
    roles: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: prismaUser.id,
      authId: prismaUser.authId,
      email: prismaUser.email,
      phone: prismaUser.phone,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      avatar: prismaUser.avatar,
      roles: prismaUser.roles as Role[],
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
