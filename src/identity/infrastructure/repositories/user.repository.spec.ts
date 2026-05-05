import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Role } from 'src/common/auth';
import {
  mockUser,
  mockUserSearchQuery,
  mockPagedResult,
} from '../../__fixtures__/identity.fixtures';
import { UserRepository } from './user.repository';

const mockPrismaUser = {
  id: 'user-id-1',
  authId: 'auth-id-1',
  email: 'test@example.com',
  phone: null,
  firstName: 'John',
  lastName: 'Doe',
  avatar: null,
  roles: ['USER'],
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('UserRepository', () => {
  let sut: UserRepository;
  let mockPrisma: { client: { user: jest.Mocked<any> } };

  beforeEach(async () => {
    mockPrisma = {
      client: {
        user: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
          delete: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    sut = module.get(UserRepository);
  });

  describe('findById', () => {
    it('returns domain user when found', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(mockPrismaUser);

      const actualResult = await sut.findById('user-id-1');

      expect(actualResult).not.toBeNull();
      expect(actualResult?.id).toBe(mockPrismaUser.id);
      expect(actualResult?.roles).toEqual([Role.USER]);
    });

    it('returns null when user not found', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      const actualResult = await sut.findById('non-existent');

      expect(actualResult).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('returns empty array for empty ids input', async () => {
      const actualResult = await sut.findByIds([]);

      expect(actualResult).toEqual([]);
      expect(mockPrisma.client.user.findMany).not.toHaveBeenCalled();
    });

    it('returns mapped users for provided ids', async () => {
      mockPrisma.client.user.findMany.mockResolvedValue([mockPrismaUser]);

      const actualResult = await sut.findByIds(['user-id-1']);

      expect(actualResult).toHaveLength(1);
      expect(actualResult[0].id).toBe(mockPrismaUser.id);
    });
  });

  describe('findUnique', () => {
    it('finds user by id', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(mockPrismaUser);

      const actualResult = await sut.findUnique({ where: { id: 'user-id-1' } });

      expect(actualResult?.id).toBe(mockPrismaUser.id);
    });

    it('returns null when user not found', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);

      const actualResult = await sut.findUnique({
        where: { id: 'non-existent' },
      });

      expect(actualResult).toBeNull();
    });
  });

  describe('upsert', () => {
    it('creates new user and maps to domain entity', async () => {
      mockPrisma.client.user.upsert.mockResolvedValue(mockPrismaUser);
      const inputUser = mockUser();

      const actualResult = await sut.upsert({
        where: { authId: inputUser.authId },
        create: {
          authId: inputUser.authId,
          firstName: inputUser.firstName,
          roles: inputUser.roles,
        },
        update: { firstName: inputUser.firstName },
      });

      expect(actualResult.id).toBe(mockPrismaUser.id);
    });
  });

  describe('update', () => {
    it('updates user and maps to domain entity', async () => {
      const updatedPrismaUser = { ...mockPrismaUser, firstName: 'Jane' };
      mockPrisma.client.user.update.mockResolvedValue(updatedPrismaUser);

      const actualResult = await sut.update({
        where: { id: 'user-id-1' },
        data: { firstName: 'Jane' },
      });

      expect(actualResult.firstName).toBe('Jane');
    });
  });

  describe('search', () => {
    it('returns paged result with mapped users', async () => {
      mockPrisma.client.user.findMany.mockResolvedValue([mockPrismaUser]);
      mockPrisma.client.user.count.mockResolvedValue(1);

      const actualResult = await sut.search(mockUserSearchQuery());

      expect(actualResult.data).toHaveLength(1);
      expect(actualResult.meta.totalItems).toBe(1);
    });

    it('returns empty result when no users found', async () => {
      mockPrisma.client.user.findMany.mockResolvedValue([]);
      mockPrisma.client.user.count.mockResolvedValue(0);

      const actualResult = await sut.search(mockUserSearchQuery());

      expect(actualResult.data).toHaveLength(0);
    });
  });

  describe('updateRole', () => {
    it('updates user roles and returns domain entity', async () => {
      const updatedPrismaUser = { ...mockPrismaUser, roles: ['ADMIN'] };
      mockPrisma.client.user.update.mockResolvedValue(updatedPrismaUser);

      const actualResult = await sut.updateRole('user-id-1', [Role.ADMIN]);

      expect(actualResult.roles).toEqual([Role.ADMIN]);
    });
  });

  describe('deactivate', () => {
    it('sets isActive to false and returns domain entity', async () => {
      const deactivatedUser = { ...mockPrismaUser, isActive: false };
      mockPrisma.client.user.update.mockResolvedValue(deactivatedUser);

      const actualResult = await sut.deactivate('user-id-1');

      expect(actualResult.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('sets isActive to true and returns domain entity', async () => {
      mockPrisma.client.user.update.mockResolvedValue(mockPrismaUser);

      const actualResult = await sut.activate('user-id-1');

      expect(actualResult.isActive).toBe(true);
    });
  });

  describe('delete', () => {
    it('calls prisma delete with the userId', async () => {
      mockPrisma.client.user.delete.mockResolvedValue(undefined);

      await sut.delete('user-id-1');

      expect(mockPrisma.client.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
    });
  });
});
