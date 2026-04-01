import { PagedResult } from 'src/common/models';

import { UserActivity } from '../entities/user-activity.entity';
import { ActivitySearchQuery } from '../queries/activity-search.query';

export const USER_ACTIVITY_REPOSITORY = Symbol('USER_ACTIVITY_REPOSITORY');

export interface IUserActivityRepository {
  findByAuthId(
    authId: string,
    query: ActivitySearchQuery,
  ): Promise<PagedResult<UserActivity>>;
  create(activity: Omit<UserActivity, 'id'>): Promise<UserActivity>;
}
