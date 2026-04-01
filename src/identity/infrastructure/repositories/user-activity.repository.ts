import { Injectable } from '@nestjs/common';
import { PagedResult } from 'src/common/models';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  UserActivity as PrismaUserActivity,
  UserActivityType as PrismaUserActivityType,
} from 'src/generated/prisma/client';

import { IUserActivityRepository } from '../../domain/ports/user-activity.repository.port';
import { UserActivity, UserActivityType } from '../../domain/entities/user-activity.entity';
import { ActivitySearchQuery } from '../../domain/queries/activity-search.query';

@Injectable()
export class UserActivityRepository implements IUserActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(activity: Omit<UserActivity, 'id'>): Promise<UserActivity> {
    const created = await this.prisma.client.userActivity.create({
      data: {
        authId: activity.authId,
        activityType: activity.activityType as unknown as PrismaUserActivityType,
        performedBy: activity.performedBy,
        details: activity.details,
        metadata: activity.metadata ?? {},
        timestamp: new Date(),
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        success: activity.success,
        location: activity.location,
        device: activity.device,
        client: activity.client,
        os: activity.os,
      },
    });

    return this.mapToEntity(created);
  }

  async findByAuthId(
    authId: string,
    query: ActivitySearchQuery,
  ): Promise<PagedResult<UserActivity>> {
    const { activityType, startDate, endDate } = query;

    const pageNumber = query.pageNumber ?? 0;
    const pageSize = query.pageSize ?? 10;
    const skip = pageNumber * pageSize;
    const take = pageSize;

    const where = {
      authId,
      activityType: activityType
        ? (activityType as unknown as PrismaUserActivityType)
        : undefined,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.client.userActivity.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      }),
      this.prisma.client.userActivity.count({ where }),
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

    return new PagedResult(items.map(this.mapToEntity), meta);
  }

  private mapToEntity(prismaActivity: PrismaUserActivity): UserActivity {
    return new UserActivity({
      id: prismaActivity.id,
      authId: prismaActivity.authId,
      activityType: prismaActivity.activityType as unknown as UserActivityType,
      performedBy: prismaActivity.performedBy,
      details: (prismaActivity.details as Record<string, any>) ?? {},
      timestamp: prismaActivity.timestamp,
      ipAddress: prismaActivity.ipAddress,
      userAgent: prismaActivity.userAgent,
      metadata: prismaActivity.metadata as Record<string, any> | null,
      success: prismaActivity.success,
      location: prismaActivity.location,
      device: prismaActivity.device,
      client: prismaActivity.client,
      os: prismaActivity.os,
    });
  }
}
