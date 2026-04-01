import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UseGuards,
  Param,
  Query,
  Logger,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PagedResult } from 'src/common/models';
import { AuthCtx, Role, type User } from 'src/common/auth';
import {
  AuthGuard,
  AuthContext,
  AuthContextUser,
  RolesGuard,
  RequireAnyRoles,
} from 'src/common/auth/adapter/presentation/nestjs';
import { CreatedResponse, OkResponse, PaginatedResponse } from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';

import { CreateUserDto } from './dto/user.input';
import { UserDto } from './dto/user.output';
import { UserSearchFiltersDto } from './dto/user-search-filters.input';
import { BulkUserOperationDto } from './dto/bulk-user-operation.input';
import { BulkOperationResultDto } from './dto/bulk-user-operation.output';
import { UserActivityDto } from './dto/user-activity.output';
import { ActivityFiltersDto } from './dto/activity-filters.input';
import { IDENTITY_ERRORS, IdentityErrorFactory } from '../domain/errors';
import {
  UserCreateUseCase,
  UserSearchUseCase,
  UserGetByIdUseCase,
  UserGetProfileUseCase,
  UserUpdateProfileUseCase,
  UserBulkOperationUseCase,
} from '../application/use-cases/user';
import { UserActivityGetUseCase } from '../application/use-cases/user/user-activity-get.use-case';
import { ProfileDto } from './dto/profile.output';
import { PatchProfileDto } from './dto/profile.input';


@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('users')
@ApiBearerAuth()
@ErrorResponse(COMMON_ERRORS)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userCreateUseCase: UserCreateUseCase,
    private readonly userSearchUseCase: UserSearchUseCase,
    private readonly userGetByIdUseCase: UserGetByIdUseCase,
    private readonly userBulkOperationUseCase: UserBulkOperationUseCase,
    private readonly userActivityGetUseCase: UserActivityGetUseCase,
    private readonly userGetProfileUseCase: UserGetProfileUseCase,
    private readonly userUpdateProfileUseCase: UserUpdateProfileUseCase,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @CreatedResponse(UserDto)
  @ErrorResponse({
    REQUIRE_PERSON: IDENTITY_ERRORS.REQUIRE_PERSON,
  })
  async create(
    @Body() userData: CreateUserDto,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<UserDto> {
    this.logger.debug('Creating user with data: %o', userData);
    this.validatePerson(authCtx);

    const person = authCtx.getPerson();

    const userUpsertInput = CreateUserDto.toApplication(
      userData,
      person?.authId ?? '',
      person?.email,
      person?.phone,
    );

    const user = await this.userCreateUseCase.execute(userUpsertInput, authCtx.getRequestContext());

    return UserDto.fromApplication(user);
  }

  @Get()
  @ApiOperation({ summary: 'List users' })
  @PaginatedResponse(UserDto)
  @ErrorResponse({})
  @RequireAnyRoles(Role.ROOT, Role.ADMIN)
  async list(
    @Query() filters: UserSearchFiltersDto,
  ): Promise<PagedResult<UserDto>> {
    const userPagedResult = await this.userSearchUseCase.execute(
      filters.toQuery(),
    );

    return PagedResult.transform(userPagedResult, UserDto.fromApplication);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk operations on users' })
  @OkResponse(BulkOperationResultDto)
  @ErrorResponse({
    INVALID_BULK_OPERATION: IDENTITY_ERRORS.INVALID_BULK_OPERATION,
  })
  @RequireAnyRoles(Role.ADMIN)
  async bulkOperation(
    @Body() operation: BulkUserOperationDto,
    @AuthContextUser() user: User,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<BulkOperationResultDto> {
    const result = await this.userBulkOperationUseCase.execute(
      operation,
      user.authId,
      authCtx.getRequestContext(),
    );
    return BulkOperationResultDto.fromResult(result);
  }

  @Get('profile')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Get user profile' })
  @OkResponse(ProfileDto)
  @ErrorResponse({
    USER_PROFILE_NOT_FOUND: IDENTITY_ERRORS.USER_PROFILE_NOT_FOUND,
  })
  async get(@AuthContextUser() user: User): Promise<ProfileDto> {
    const profile = await this.userGetProfileUseCase.execute(user.id);
    return ProfileDto.fromApplication(profile);
  }

  @Patch('profile')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Update user profile' })
  @OkResponse(ProfileDto)
  @ErrorResponse({})
  async update(
    @Body() profileData: PatchProfileDto,
    @AuthContextUser() user: User,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<ProfileDto> {
    const updatedProfile = await this.userUpdateProfileUseCase.execute(
      user.id,
      PatchProfileDto.toApplication(profileData),
      authCtx.getRequestContext(),
    );

    return ProfileDto.fromApplication(updatedProfile);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @OkResponse(UserDto)
  @ErrorResponse({
    USER_NOT_FOUND: IDENTITY_ERRORS.USER_NOT_FOUND,
  })
  async getUser(@Param('id') userId: string): Promise<UserDto> {
    const user = await this.userGetByIdUseCase.execute(userId);
    return UserDto.fromApplication(user);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity' })
  @PaginatedResponse(UserActivityDto)
  @ErrorResponse({})
  @RequireAnyRoles(Role.ADMIN, Role.USER)
  async getUserActivity(
    @Param('id') userId: string,
    @Query() filters: ActivityFiltersDto,
  ): Promise<PagedResult<UserActivityDto>> {
    const activities = await this.userActivityGetUseCase.execute(
      userId,
      filters.toQuery(),
    );

    return PagedResult.transform(activities, UserActivityDto.fromApplication);
  }

  private validatePerson(authCtx: AuthCtx): void {
    if (!authCtx.isPerson()) {
      throw IdentityErrorFactory.requirePerson();
    }
  }
}
