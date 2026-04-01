import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PagedResult } from 'src/common/models';
import { User as PrismaUser, UserRole } from 'src/generated/prisma/client';

import { User } from '../../domain/entities/user.entity';
import { Role } from 'src/common/auth';
import {
  UpsertUserParams,
  FindUniqueUserParams,
  UpdateUserParams,
  IUserRepository,
} from '../../domain/ports/user.repository.port';
import { UserSearchQuery } from '../../domain/queries/user-search.query';

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findUnique(params: FindUniqueUserParams): Promise<User | null> {
    const user = await this.prisma.client.user.findUnique({
      where: {
        id: params.where.id,
        authId: params.where.authId,
      },
    });
    return user ? this.toDomain(user) : null;
  }

  async count(): Promise<number> {
    return this.prisma.client.user.count();
  }

  async update(params: UpdateUserParams): Promise<User> {
    const user = await this.prisma.client.user.update({
      where: {
        id: params.where.id,
        authId: params.where.authId,
      },
      data: {
        firstName: params.data.firstName,
        lastName: params.data.lastName,
        avatar: params.data.avatar,
        ...(params.data.roles !== undefined && {
          roles: params.data.roles as unknown as UserRole[],
        }),
      },
    });
    return this.toDomain(user);
  }

  async upsert(params: UpsertUserParams): Promise<User> {
    const user = await this.prisma.client.user.upsert({
      where: params.where,
      create: {
        ...params.create,
        roles: params.create.roles as unknown as UserRole[],
      },
      update: params.update,
    });
    return this.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids.length) {
      return [];
    }
    const users = await this.prisma.client.user.findMany({
      where: { id: { in: ids } },
    });
    return users.map((u) => this.toDomain(u));
  }

  async search(query: UserSearchQuery): Promise<PagedResult<User>> {
    const {
      searchTerm,
      role,
      status,
      orderDirection,
      orderBy,
      createdAtGte,
      createdAtLte,
    } = query;

    const pageNumber = query.pageNumber ?? 0;
    const pageSize = query.pageSize ?? 10;
    const skip = pageNumber * pageSize;
    const take = pageSize;

    const where: any = {
      OR: searchTerm
        ? [
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm } },
          ]
        : undefined,
      roles: role ? { has: role } : undefined,
      isActive: status ? status === 'active' : undefined,
      createdAt:
        createdAtGte || createdAtLte
          ? { gte: createdAtGte, lte: createdAtLte }
          : undefined,
    };

    let prismaOrderBy = orderBy ? [{ [orderBy]: orderDirection }] : undefined;

    if (prismaOrderBy && orderBy === 'name') {
      prismaOrderBy = [
        { firstName: orderDirection },
        { lastName: orderDirection },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        orderBy: prismaOrderBy,
        skip,
        take,
      }),
      this.prisma.client.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const meta = {
      pageSize,
      pageNumber,
      totalItems: total,
      totalPages,
      hasNextPage: pageNumber < totalPages - 1,
      hasPreviousPage: pageNumber > 0,
    };

    return new PagedResult(
      users.map((u) => this.toDomain(u)),
      meta,
    );
  }

  async updateRole(userId: string, roles: Role[]): Promise<User> {
    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: { roles: roles as unknown as UserRole[] },
    });
    return this.toDomain(user);
  }

  async deactivate(userId: string): Promise<User> {
    this.logger.log(`Deactivating user ${userId}`);
    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return this.toDomain(user);
  }

  async activate(userId: string): Promise<User> {
    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    return this.toDomain(user);
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.client.user.delete({ where: { id: userId } });
  }

  private toDomain(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      authId: prismaUser.authId,
      email: prismaUser.email,
      phone: prismaUser.phone,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      avatar: prismaUser.avatar,
      roles: prismaUser.roles as unknown as Role[],
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
