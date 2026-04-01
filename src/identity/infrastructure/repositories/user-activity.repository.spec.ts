import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UserActivityType } from '../../domain/entities/user-activity.entity';
import { mockUserActivity, mockActivitySearchQuery } from '../../__fixtures__/identity.fixtures';
import { UserActivityRepository } from './user-activity.repository';

const mockPrismaActivity = {
  id: 'activity-id-1',
  authId: 'auth-id-1',
  activityType: 'ACCOUNT_CREATED',
  performedBy: 'auth-id-1',
  details: {},
  timestamp: new Date('2024-01-01T00:00:00.000Z'),
  ipAddress: null,
  userAgent: null,
  metadata: {},
  success: true,
  location: null,
  device: null,
  client: null,
  os: null,
};

describe('UserActivityRepository', () => {
  let sut: UserActivityRepository;
  let mockPrisma: { client: { userActivity: jest.Mocked<any> } };

  beforeEach(async () => {
    mockPrisma = {
      client: {
        userActivity: {
          create: jest.fn(),
          findMany: jest.fn(),
          count: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivityRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    sut = module.get(UserActivityRepository);
  });

  describe('create', () => {
    it('creates activity record and maps to domain entity', async () => {
      mockPrisma.client.userActivity.create.mockResolvedValue(mockPrismaActivity);
      const inputActivity = mockUserActivity();

      const actualResult = await sut.create(inputActivity);

      expect(actualResult.id).toBe(mockPrismaActivity.id);
      expect(actualResult.activityType).toBe(UserActivityType.ACCOUNT_CREATED);
      expect(actualResult.authId).toBe(mockPrismaActivity.authId);
    });

    it('passes activity fields to Prisma create', async () => {
      mockPrisma.client.userActivity.create.mockResolvedValue(mockPrismaActivity);
      const inputActivity = mockUserActivity({
        authId: 'auth-123',
        activityType: UserActivityType.LOGIN,
      });

      await sut.create(inputActivity);

      expect(mockPrisma.client.userActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            authId: 'auth-123',
          }),
        }),
      );
    });
  });

  describe('findByAuthId', () => {
    it('returns paged result with mapped entities', async () => {
      mockPrisma.client.userActivity.findMany.mockResolvedValue([mockPrismaActivity]);
      mockPrisma.client.userActivity.count.mockResolvedValue(1);

      const actualResult = await sut.findByAuthId('auth-1', mockActivitySearchQuery());

      expect(actualResult.data).toHaveLength(1);
      expect(actualResult.data[0].id).toBe(mockPrismaActivity.id);
      expect(actualResult.meta.totalItems).toBe(1);
    });

    it('returns empty paged result when no activities found', async () => {
      mockPrisma.client.userActivity.findMany.mockResolvedValue([]);
      mockPrisma.client.userActivity.count.mockResolvedValue(0);

      const actualResult = await sut.findByAuthId('auth-1', mockActivitySearchQuery());

      expect(actualResult.data).toHaveLength(0);
      expect(actualResult.meta.totalItems).toBe(0);
    });

    it('applies activity type filter when provided', async () => {
      mockPrisma.client.userActivity.findMany.mockResolvedValue([]);
      mockPrisma.client.userActivity.count.mockResolvedValue(0);

      await sut.findByAuthId(
        'auth-1',
        mockActivitySearchQuery({ activityType: 'LOGIN' }),
      );

      const findManyCall = mockPrisma.client.userActivity.findMany.mock.calls[0][0];
      expect(findManyCall.where.activityType).toBe('LOGIN');
    });

    it('calculates pagination metadata correctly', async () => {
      mockPrisma.client.userActivity.findMany.mockResolvedValue([mockPrismaActivity]);
      mockPrisma.client.userActivity.count.mockResolvedValue(25);

      const actualResult = await sut.findByAuthId(
        'auth-1',
        mockActivitySearchQuery({ pageNumber: 0, pageSize: 10 }),
      );

      expect(actualResult.meta.totalPages).toBe(3);
      expect(actualResult.meta.hasNextPage).toBe(true);
      expect(actualResult.meta.hasPreviousPage).toBe(false);
    });
  });
});
