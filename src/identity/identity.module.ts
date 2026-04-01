import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { USER_REPOSITORY } from './domain/ports/user.repository.port';
import { UserActivityRepository } from './infrastructure/repositories/user-activity.repository';
import { USER_ACTIVITY_REPOSITORY } from './domain/ports/user-activity.repository.port';
import {
  UserCreateUseCase,
  UserSearchUseCase,
  UserGetByIdUseCase,
  UserBulkOperationUseCase,
  UserActivityGetUseCase,
  UserGetProfileUseCase,
  UserUpdateProfileUseCase,
} from './application/use-cases/user';
import {
  UserCreatedUseCase,
  UserUpdatedUseCase,
  UserRoleChangedUseCase,
  UserActivatedUseCase,
  UserDeactivatedUseCase,
  UserDeletedUseCase,
  UserPasswordChangedUseCase,
  UserRegisteredUseCase,
  UserLoggedInUseCase,
  UserLoggedOutUseCase,
  UserPasswordResetRequestedUseCase,
  UserPasswordResetCompletedUseCase,
} from './application/use-cases/user-activity';
import { UserActivityHandler } from './application/handlers/user-activity.handler';

@Module({
  imports: [],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: USER_ACTIVITY_REPOSITORY,
      useClass: UserActivityRepository,
    },
    UserActivityHandler,
    UserCreateUseCase,
    UserSearchUseCase,
    UserGetByIdUseCase,
    UserBulkOperationUseCase,
    UserActivityGetUseCase,
    UserGetProfileUseCase,
    UserUpdateProfileUseCase,
    UserCreatedUseCase,
    UserUpdatedUseCase,
    UserRoleChangedUseCase,
    UserActivatedUseCase,
    UserDeactivatedUseCase,
    UserDeletedUseCase,
    UserPasswordChangedUseCase,
    UserRegisteredUseCase,
    UserLoggedInUseCase,
    UserLoggedOutUseCase,
    UserPasswordResetRequestedUseCase,
    UserPasswordResetCompletedUseCase,
  ],
  controllers: [UserController],
})
export class IdentityModule {}
