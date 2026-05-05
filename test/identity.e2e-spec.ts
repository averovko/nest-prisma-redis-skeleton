import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { GlobalErrorFilter } from '../src/common/errors';
import { AuthCtx, Role, AuthGuard } from '../src/common/auth';
import { USER_REPOSITORY } from '../src/identity/domain/ports/user.repository.port';
import { USER_ACTIVITY_REPOSITORY } from '../src/identity/domain/ports/user-activity.repository.port';
import { EVENT_BUS_TOKEN } from '../src/common/event-manager';
import { UserController } from '../src/identity/presentation/user.controller';
import { UserCreateUseCase } from '../src/identity/application/use-cases/user/user-create.use-case';
import { UserSearchUseCase } from '../src/identity/application/use-cases/user/user-search.use-case';
import { UserGetByIdUseCase } from '../src/identity/application/use-cases/user/user-get-by-id.use-case';
import { UserBulkOperationUseCase } from '../src/identity/application/use-cases/user/user-bulk-operation.use-case';
import { UserActivityGetUseCase } from '../src/identity/application/use-cases/user/user-activity-get.use-case';
import { UserGetProfileUseCase } from '../src/identity/application/use-cases/user/user-get-profile.use-case';
import { UserUpdateProfileUseCase } from '../src/identity/application/use-cases/user/user-update-profile.use-case';
import { IdentityErrorCode } from '../src/identity/domain/errors/identity.error-codes';
import { PagedResult } from '../src/common/models';

const TEST_USER_ID = 'e2e-user-id-1';
const TEST_AUTH_ID = 'e2e-auth-id-1';
const TEST_EMAIL = 'e2e@example.com';

const mockUserEntity = {
  id: TEST_USER_ID,
  authId: TEST_AUTH_ID,
  email: TEST_EMAIL,
  phone: null,
  firstName: 'E2E',
  lastName: 'Test',
  avatar: null,
  roles: [Role.ADMIN, Role.USER],
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authCtx = AuthCtx.forPerson(
      { authId: TEST_AUTH_ID },
      mockUserEntity as any,
    );
    req.authCtx = authCtx;
    return true;
  }
}

describe('Identity (e2e)', () => {
  let app: INestApplication;
  let mockUserRepo: jest.Mocked<any>;
  let mockActivityRepo: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  const emptyPagedResult = new PagedResult([], {
    pageSize: 10,
    pageNumber: 0,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  beforeEach(async () => {
    mockUserRepo = {
      findUnique: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      search: jest.fn(),
      updateRole: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
      delete: jest.fn(),
    };

    mockActivityRepo = {
      create: jest.fn(),
      findByAuthId: jest.fn(),
    };

    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserCreateUseCase,
        UserSearchUseCase,
        UserGetByIdUseCase,
        UserBulkOperationUseCase,
        UserActivityGetUseCase,
        UserGetProfileUseCase,
        UserUpdateProfileUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalErrorFilter());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/users', () => {
    it('creates a user and returns 201 with UserDto', async () => {
      mockUserRepo.findUnique.mockResolvedValue(null);
      mockUserRepo.upsert.mockResolvedValue(mockUserEntity);

      const response = await request(app.getHttpServer())
        .post('/v1/users')
        .send({ name: 'E2E' })
        .expect(201);

      expect(response.body.id).toBe(TEST_USER_ID);
      expect(response.body.firstName).toBe('E2E');
    });
  });

  describe('GET /v1/users', () => {
    it('returns 200 with paged user list', async () => {
      const pagedResult = new PagedResult([mockUserEntity], {
        pageSize: 10,
        pageNumber: 0,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      mockUserRepo.search.mockResolvedValue(pagedResult);

      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.totalItems).toBe(1);
    });

    it('returns empty list when no users found', async () => {
      mockUserRepo.search.mockResolvedValue(emptyPagedResult);

      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /v1/users/:id', () => {
    it('returns 200 with user data when found', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUserEntity);

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${TEST_USER_ID}`)
        .expect(200);

      expect(response.body.id).toBe(TEST_USER_ID);
    });

    it('returns 404 when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/v1/users/non-existent')
        .expect(404);

      expect(response.body.code).toBe(IdentityErrorCode.USER_NOT_FOUND);
    });
  });

  describe('GET /v1/users/:id/activity', () => {
    it('returns 200 with paged activity list', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUserEntity);
      mockActivityRepo.findByAuthId.mockResolvedValue(emptyPagedResult);

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${TEST_USER_ID}/activity`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /v1/users/bulk', () => {
    it('returns 200 with bulk operation result', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUserEntity);
      mockUserRepo.activate.mockResolvedValue(mockUserEntity);

      const response = await request(app.getHttpServer())
        .post('/v1/users/bulk')
        .send({ operation: 'ACTIVATE', userIds: [TEST_USER_ID] })
        .expect(200);

      expect(response.body.successCount).toBe(1);
      expect(response.body.failureCount).toBe(0);
    });

    it('returns 400 for invalid bulk operation', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/users/bulk')
        .send({ operation: 'INVALID_OP', userIds: [TEST_USER_ID] })
        .expect(400);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /v1/users/profile', () => {
    it('returns 200 with user profile', async () => {
      mockUserRepo.findUnique.mockResolvedValue(mockUserEntity);

      const response = await request(app.getHttpServer())
        .get('/v1/users/profile')
        .expect(200);

      expect(response.body.id).toBe(TEST_USER_ID);
      expect(response.body.firstName).toBe('E2E');
    });

    it('returns 404 when profile not found', async () => {
      mockUserRepo.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/v1/users/profile')
        .expect(404);

      expect(response.body.code).toBe(IdentityErrorCode.USER_PROFILE_NOT_FOUND);
    });
  });

  describe('PATCH /v1/users/profile', () => {
    it('returns 200 with updated profile', async () => {
      const updatedUser = { ...mockUserEntity, firstName: 'Updated' };
      mockUserRepo.findUnique.mockResolvedValue(mockUserEntity);
      mockUserRepo.update.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch('/v1/users/profile')
        .send({ name: 'Updated' })
        .expect(200);

      expect(response.body.firstName).toBe('Updated');
    });
  });
});
