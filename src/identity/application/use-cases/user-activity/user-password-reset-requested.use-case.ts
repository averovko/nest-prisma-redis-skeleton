import { Inject, Injectable } from '@nestjs/common';
import { type RequestContext } from 'src/common/auth';
import { type EventBusMessage, type UserPasswordResetRequestedPayload } from 'src/common/event-manager';
import { UserActivity, UserActivityType } from 'src/identity/domain/entities';
import {
  type IUserActivityRepository,
  USER_ACTIVITY_REPOSITORY,
} from 'src/identity/domain/ports/user-activity.repository.port';

@Injectable()
export class UserPasswordResetRequestedUseCase {
  constructor(
    @Inject(USER_ACTIVITY_REPOSITORY)
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  async execute(
    event: EventBusMessage<UserPasswordResetRequestedPayload>,
  ): Promise<UserActivity> {
    const ctx = event.metadata.metadata as RequestContext | undefined;
    const activity = new UserActivity({
      authId: event.payload.authId,
      performedBy: event.payload.authId,
      activityType: UserActivityType.PASSWORD_RESET_REQUEST,
      details: {
        email: event.payload.email,
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
