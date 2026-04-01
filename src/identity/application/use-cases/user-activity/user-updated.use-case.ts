import { Inject, Injectable } from '@nestjs/common';
import { UserActivity, UserActivityType } from 'src/identity/domain/entities';
import { UserUpdatedEvent } from 'src/identity/domain/events/user.events';
import {
  type IUserActivityRepository,
  USER_ACTIVITY_REPOSITORY,
} from 'src/identity/domain/ports/user-activity.repository.port';
import { type RequestContext } from 'src/common/auth';

@Injectable()
export class UserUpdatedUseCase {
  constructor(
    @Inject(USER_ACTIVITY_REPOSITORY)
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  async execute(event: UserUpdatedEvent): Promise<UserActivity> {
    const ctx = event.metadata.metadata as RequestContext | undefined;
    const activity = new UserActivity({
      authId: event.payload.authId,
      performedBy: event.payload.authId,
      activityType: UserActivityType.PROFILE_UPDATE,
      details: {
        firstName: event.payload.firstName,
        lastName: event.payload.lastName,
        avatar: event.payload.avatar,
      },
      metadata: {},
      timestamp: new Date(event.metadata.timestamp),
      ipAddress: ctx?.ipAddress ?? null,
      userAgent: ctx?.userAgent ?? null,
      success: true,
      location: ctx?.location ?? null,
      device: ctx?.device ?? null,
      client: ctx?.client ?? null,
      os: ctx?.os ?? null,
    });

    return this.userActivityRepository.create(activity);
  }
}
