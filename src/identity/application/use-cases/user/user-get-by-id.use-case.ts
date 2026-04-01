import { Inject, Injectable } from '@nestjs/common';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from 'src/identity/domain/ports/user.repository.port';
import { User } from 'src/identity/domain/entities';
import { IdentityErrorFactory } from 'src/identity/domain/errors';

@Injectable()
export class UserGetByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw IdentityErrorFactory.userNotFound(userId);
    }

    return user;
  }
}
