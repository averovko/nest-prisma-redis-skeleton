import { Inject, Injectable } from '@nestjs/common';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from 'src/identity/domain/ports/user.repository.port';
import { User } from 'src/identity/domain/entities';
import { UserSearchQuery } from 'src/identity/domain/queries/user-search.query';
import { PagedResult } from 'src/common';

@Injectable()
export class UserSearchUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: UserSearchQuery): Promise<PagedResult<User>> {
    return this.userRepository.search(query);
  }
}
