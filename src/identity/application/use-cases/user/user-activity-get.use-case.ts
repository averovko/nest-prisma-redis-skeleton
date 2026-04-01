import { Inject, Injectable } from '@nestjs/common';
import { UserActivity } from 'src/identity/domain/entities';
import {
  USER_ACTIVITY_REPOSITORY,
  type IUserActivityRepository,
} from 'src/identity/domain/ports/user-activity.repository.port';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from 'src/identity/domain/ports/user.repository.port';
import { ActivitySearchQuery } from 'src/identity/domain/queries/activity-search.query';
import { PagedResult } from 'src/common';
import { IdentityErrorFactory } from 'src/identity/domain/errors';

@Injectable()
export class UserActivityGetUseCase {
  constructor(
    @Inject(USER_ACTIVITY_REPOSITORY)
    private readonly userActivityRepository: IUserActivityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    userId: string,
    query: ActivitySearchQuery,
  ): Promise<PagedResult<UserActivity>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw IdentityErrorFactory.userNotFound(userId);
    }
    return this.userActivityRepository.findByAuthId(user.authId, query);
  }
}
