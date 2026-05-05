import { Inject, Injectable } from '@nestjs/common';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from 'src/identity/domain/ports/user.repository.port';
import { UpsertUserInput } from '../../dto/user.input';
import { Role, type RequestContext } from 'src/common/auth';
import { User } from 'src/identity/domain/entities';
import {
  EVENT_BUS_TOKEN,
  type EventBusPort,
} from 'src/common/event-manager/application/ports/event-bus.port';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
} from 'src/identity/domain/events/user.events';

@Injectable()
export class UserCreateUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBusPort,
  ) {}

  async execute(
    input: UpsertUserInput,
    requestContext?: RequestContext,
  ): Promise<User> {
    const existingUser = await this.userRepository.findUnique({
      where: { authId: input.authId },
    });

    const user = await this.userRepository.upsert({
      where: { authId: input.authId },
      create: {
        authId: input.authId,
        firstName: input.name,
        email: input.email,
        phone: input.phoneNumber,
        roles: [Role.USER],
        avatar: input.avatar,
      },
      update: {
        firstName: input.name,
        avatar: input.avatar,
      },
    });

    const eventParams = requestContext
      ? { metadata: requestContext }
      : undefined;

    if (!existingUser) {
      await this.eventBus.publish(new UserCreatedEvent(user, eventParams));
    } else {
      await this.eventBus.publish(new UserUpdatedEvent(user, eventParams));
    }

    return user;
  }
}
