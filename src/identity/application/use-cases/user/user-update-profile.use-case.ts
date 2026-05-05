import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from 'src/identity/domain/ports/user.repository.port';
import { IdentityErrorFactory } from 'src/identity/domain/errors';
import { PatchProfileInput } from '../../dto/profile.input';
import {
  EVENT_BUS_TOKEN,
  type EventBusPort,
} from 'src/common/event-manager/application/ports/event-bus.port';
import { UserUpdatedEvent } from 'src/identity/domain/events/user.events';
import { User } from 'src/identity/domain/entities';
import { type RequestContext } from 'src/common/auth';

@Injectable()
export class UserUpdateProfileUseCase {
  private readonly logger = new Logger(UserUpdateProfileUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBusPort,
  ) {}

  async execute(
    userId: string,
    input: PatchProfileInput,
    requestContext?: RequestContext,
  ): Promise<User> {
    const user = await this.userRepository.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`user: updateProfile: user ${userId} not found`);
      throw IdentityErrorFactory.userNotFound(userId);
    }

    try {
      const updatedUser = await this.userRepository.update({
        where: { id: userId },
        data: {
          firstName: input.name,
          avatar: input.avatar,
        },
      });

      const eventParams = requestContext
        ? { metadata: requestContext }
        : undefined;
      await this.eventBus.publish(
        new UserUpdatedEvent(updatedUser, eventParams),
      );

      return updatedUser;
    } catch (error) {
      throw IdentityErrorFactory.userUpdateFailed(userId, error);
    }
  }
}
