import { Test, TestingModule } from '@nestjs/testing';
import { mockCredentials } from '../../__fixtures__/auth.fixtures';
import { CredentialsRepository } from './credentials.repository';

jest.mock('src/common/prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {},
}));

import { PrismaService } from 'src/common/prisma/prisma.service';

describe('CredentialsRepository', () => {
  let repository: CredentialsRepository;
  let mockPrismaCredentials: jest.Mocked<any>;

  const buildMockPrismaService = () => ({
    client: {
      credentials: mockPrismaCredentials,
    },
  });

  beforeEach(async () => {
    mockPrismaCredentials = {
      create: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsRepository,
        { provide: PrismaService, useValue: buildMockPrismaService() },
      ],
    }).compile();

    repository = module.get(CredentialsRepository);
  });

  describe('create', () => {
    it('calls prisma.credentials.create with the input data and returns credentials', async () => {
      const inputCreate = { authId: 'auth-1', email: 'e@e.com', passwordHash: 'hash' };
      const expectedCredentials = mockCredentials();
      mockPrismaCredentials.create.mockResolvedValue(expectedCredentials);

      const actualResult = await repository.create(inputCreate);

      expect(mockPrismaCredentials.create).toHaveBeenCalledWith({ data: inputCreate });
      expect(actualResult).toEqual(expectedCredentials);
    });
  });

  describe('findById', () => {
    it('returns credentials when found by id', async () => {
      const expectedCredentials = mockCredentials();
      mockPrismaCredentials.findUnique.mockResolvedValue(expectedCredentials);

      const actualResult = await repository.findById('cred-id-1');

      expect(mockPrismaCredentials.findUnique).toHaveBeenCalledWith({ where: { id: 'cred-id-1' } });
      expect(actualResult).toEqual(expectedCredentials);
    });

    it('returns null when credentials are not found by id', async () => {
      mockPrismaCredentials.findUnique.mockResolvedValue(null);

      const actualResult = await repository.findById('missing-id');

      expect(actualResult).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns credentials when found by email', async () => {
      const expectedCredentials = mockCredentials();
      mockPrismaCredentials.findUnique.mockResolvedValue(expectedCredentials);

      const actualResult = await repository.findByEmail('test@example.com');

      expect(mockPrismaCredentials.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(actualResult).toEqual(expectedCredentials);
    });

    it('returns null when credentials are not found by email', async () => {
      mockPrismaCredentials.findUnique.mockResolvedValue(null);

      const actualResult = await repository.findByEmail('unknown@example.com');

      expect(actualResult).toBeNull();
    });
  });

  describe('findByAuthId', () => {
    it('returns credentials when found by authId', async () => {
      const expectedCredentials = mockCredentials();
      mockPrismaCredentials.findUnique.mockResolvedValue(expectedCredentials);

      const actualResult = await repository.findByAuthId('auth-id-1');

      expect(mockPrismaCredentials.findUnique).toHaveBeenCalledWith({ where: { authId: 'auth-id-1' } });
      expect(actualResult).toEqual(expectedCredentials);
    });

    it('returns null when credentials are not found by authId', async () => {
      mockPrismaCredentials.findUnique.mockResolvedValue(null);

      const actualResult = await repository.findByAuthId('unknown-auth-id');

      expect(actualResult).toBeNull();
    });
  });

  describe('existsByEmail', () => {
    it('returns true when count is greater than zero', async () => {
      mockPrismaCredentials.count.mockResolvedValue(1);

      const actualResult = await repository.existsByEmail('taken@example.com');

      expect(mockPrismaCredentials.count).toHaveBeenCalledWith({ where: { email: 'taken@example.com' } });
      expect(actualResult).toBe(true);
    });

    it('returns false when count is zero', async () => {
      mockPrismaCredentials.count.mockResolvedValue(0);

      const actualResult = await repository.existsByEmail('available@example.com');

      expect(actualResult).toBe(false);
    });
  });

  describe('updatePasswordHash', () => {
    it('calls prisma.credentials.update with correct where clause and data', async () => {
      const expectedUpdated = mockCredentials({ passwordHash: '$new$hash' });
      mockPrismaCredentials.update.mockResolvedValue(expectedUpdated);

      const actualResult = await repository.updatePasswordHash('auth-id-1', '$new$hash');

      expect(mockPrismaCredentials.update).toHaveBeenCalledWith({
        where: { authId: 'auth-id-1' },
        data: { passwordHash: '$new$hash' },
      });
      expect(actualResult).toEqual(expectedUpdated);
    });
  });
});
