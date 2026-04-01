import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from 'src/identity/domain/ports/user.repository.port';
import { IdentityErrorFactory } from 'src/identity/domain/errors';
import { User } from 'src/identity/domain/entities';

@Injectable()
export class UserGetProfileUseCase {
  private readonly logger = new Logger(UserGetProfileUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(
        `user: getProfile: user ${JSON.stringify(userId)} not found`,
      );
      throw IdentityErrorFactory.userProfileNotFound(userId);
    }

    return user;
  }
}
