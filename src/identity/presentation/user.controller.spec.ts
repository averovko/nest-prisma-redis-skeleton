import { Test, TestingModule } from '@nestjs/testing';
import { AuthCtx, AuthGuard, RolesGuard, User } from 'src/common/auth';
import { UserCreateUseCase,
  UserSearchUseCase,
  UserGetByIdUseCase,
  UserBulkOperationUseCase,
  UserGetProfileUseCase,
  UserUpdateProfileUseCase,
 } from '../application/use-cases/user';
import { UserActivityGetUseCase } from '../application/use-cases/user/user-activity-get.use-case';
import {
  mockUser,
  mockUserActivity,
  mockPagedResult,
  mockUserSearchQuery,
  mockActivitySearchQuery,
} from '../__fixtures__/identity.fixtures';
import { UserSearchFiltersDto } from './dto/user-search-filters.input';
import { ActivityFiltersDto } from './dto/activity-filters.input';
import { BulkUserOperationDto } from './dto/bulk-user-operation.input';
import { BulkOperationType } from '../application/dto/bulk-user-operation.dto';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;
  let mockUserCreateUseCase: jest.Mocked<any>;
  let mockUserSearchUseCase: jest.Mocked<any>;
  let mockUserGetByIdUseCase: jest.Mocked<any>;
  let mockUserBulkOperationUseCase: jest.Mocked<any>;
  let mockUserActivityGetUseCase: jest.Mocked<any>;
  let mockUserGetProfileUseCase: jest.Mocked<any>;
  let mockUserUpdateProfileUseCase: jest.Mocked<any>;

  const mockUserEntity = mockUser();
  const mockAuthCtx = AuthCtx.forPerson(
    { authId: mockUserEntity.authId },
    mockUserEntity as unknown as User,
  );

  beforeEach(async () => {
    mockUserCreateUseCase = { execute: jest.fn() };
    mockUserSearchUseCase = { execute: jest.fn() };
    mockUserGetByIdUseCase = { execute: jest.fn() };
    mockUserBulkOperationUseCase = { execute: jest.fn() };
    mockUserActivityGetUseCase = { execute: jest.fn() };
    mockUserGetProfileUseCase = { execute: jest.fn() };
    mockUserUpdateProfileUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserCreateUseCase, useValue: mockUserCreateUseCase },
        { provide: UserSearchUseCase, useValue: mockUserSearchUseCase },
        { provide: UserGetByIdUseCase, useValue: mockUserGetByIdUseCase },
        { provide: UserBulkOperationUseCase, useValue: mockUserBulkOperationUseCase },
        { provide: UserActivityGetUseCase, useValue: mockUserActivityGetUseCase },
        { provide: UserGetProfileUseCase, useValue: mockUserGetProfileUseCase },
        {
          provide: UserUpdateProfileUseCase,
          useValue: mockUserUpdateProfileUseCase,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UserController);
  });

  describe('create', () => {
    it('creates user and returns UserDto', async () => {
      mockUserCreateUseCase.execute.mockResolvedValue(mockUserEntity);
      const inputDto = { name: 'John' };

      const actualResult = await controller.create(inputDto as any, mockAuthCtx);

      expect(actualResult.id).toBe(mockUserEntity.id);
      expect(actualResult.firstName).toBe(mockUserEntity.firstName);
    });

    it('throws when auth context is not a person', async () => {
      const serviceCtx = AuthCtx.forService({ id: 'service-1', name: 'test' } as any);

      await expect(controller.create({} as any, serviceCtx)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('returns paged result of UserDtos', async () => {
      const expectedResult = mockPagedResult([mockUserEntity]);
      mockUserSearchUseCase.execute.mockResolvedValue(expectedResult);
      const inputFilters = Object.assign(new UserSearchFiltersDto(), {
        toQuery: jest.fn().mockReturnValue(mockUserSearchQuery()),
      });

      const actualResult = await controller.list(inputFilters);

      expect(actualResult.data).toHaveLength(1);
    });
  });

  describe('getUser', () => {
    it('returns UserDto when user is found', async () => {
      mockUserGetByIdUseCase.execute.mockResolvedValue(mockUserEntity);

      const actualResult = await controller.getUser(mockUserEntity.id);

      expect(actualResult.id).toBe(mockUserEntity.id);
    });
  });

  describe('getUserActivity', () => {
    it('returns paged activity result', async () => {
      const expectedResult = mockPagedResult([mockUserActivity()]);
      mockUserActivityGetUseCase.execute.mockResolvedValue(expectedResult);
      const inputFilters = Object.assign(new ActivityFiltersDto(), {
        toQuery: jest.fn().mockReturnValue(mockActivitySearchQuery()),
      });

      const actualResult = await controller.getUserActivity(mockUserEntity.id, inputFilters);

      expect(actualResult.data).toHaveLength(1);
    });
  });

  describe('get', () => {
    it('returns ProfileDto with the current user profile', async () => {
      mockUserGetProfileUseCase.execute.mockResolvedValue(mockUserEntity);

      const actualResult = await controller.get(mockUserEntity as unknown as User);

      expect(actualResult.id).toBe(mockUserEntity.id);
      expect(actualResult.firstName).toBe(mockUserEntity.firstName);
    });

    it('calls get profile use case with the user id', async () => {
      mockUserGetProfileUseCase.execute.mockResolvedValue(mockUserEntity);

      await controller.get(mockUserEntity as unknown as User);

      expect(mockUserGetProfileUseCase.execute).toHaveBeenCalledWith(
        mockUserEntity.id,
      );
    });
  });

  describe('update', () => {
    const mockAuthCtx = AuthCtx.forPerson({ authId: 'auth-id-1' }, mockUser());

    it('updates profile and returns ProfileDto', async () => {
      const inputUpdate = { name: 'Jane', avatar: undefined };
      const updatedUser = mockUser({ firstName: 'Jane' });
      mockUserUpdateProfileUseCase.execute.mockResolvedValue(updatedUser);

      const actualResult = await controller.update(inputUpdate as any, mockUserEntity as unknown as User, mockAuthCtx);

      expect(actualResult.firstName).toBe('Jane');
    });

    it('calls update profile use case with userId and input', async () => {
      mockUserUpdateProfileUseCase.execute.mockResolvedValue(mockUserEntity);
      const inputUpdate = { name: 'Jane' };

      await controller.update(inputUpdate as any, mockUserEntity as unknown as User, mockAuthCtx);

      expect(mockUserUpdateProfileUseCase.execute).toHaveBeenCalledWith(
        mockUserEntity.id,
        expect.objectContaining({ name: 'Jane' }),
        undefined,
      );
    });
  });

  describe('bulkOperation', () => {
    it('returns bulk operation result', async () => {
      const expectedResult = { successCount: 1, failureCount: 0, errors: [] };
      mockUserBulkOperationUseCase.execute.mockResolvedValue(expectedResult);
      const inputOperation: BulkUserOperationDto = {
        operation: BulkOperationType.ACTIVATE,
        userIds: ['user-1'],
      };

      const actualResult = await controller.bulkOperation(
        inputOperation,
        mockUserEntity as unknown as User,
        mockAuthCtx,
      );

      expect(actualResult.successCount).toBe(1);
    });

    it('passes requestContext from authCtx to the use case', async () => {
      const expectedResult = { successCount: 1, failureCount: 0, errors: [] };
      mockUserBulkOperationUseCase.execute.mockResolvedValue(expectedResult);
      const requestContext = { ipAddress: '3.3.3.3', userAgent: 'CtrlAgent' };
      const enrichedCtx = mockAuthCtx.withRequestContext(requestContext);
      const inputOperation: BulkUserOperationDto = {
        operation: BulkOperationType.ACTIVATE,
        userIds: ['user-1'],
      };

      await controller.bulkOperation(
        inputOperation,
        mockUserEntity as unknown as User,
        enrichedCtx,
      );

      expect(mockUserBulkOperationUseCase.execute).toHaveBeenCalledWith(
        inputOperation,
        mockUserEntity.authId,
        requestContext,
      );
    });
  });
});
