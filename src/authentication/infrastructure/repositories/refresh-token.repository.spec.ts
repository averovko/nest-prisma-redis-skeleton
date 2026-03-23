import { Test, TestingModule } from '@nestjs/testing';
import { mockRefreshToken } from '../../__fixtures__/auth.fixtures';
import { RefreshTokenRepository } from './refresh-token.repository';

jest.mock('src/common/prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {},
}));

import { PrismaService } from 'src/common/prisma/prisma.service';

describe('RefreshTokenRepository', () => {
  let repository: RefreshTokenRepository;
  let mockPrismaRefreshToken: jest.Mocked<any>;

  beforeEach(async () => {
    mockPrismaRefreshToken = {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenRepository,
        {
          provide: PrismaService,
          useValue: { client: { refreshToken: mockPrismaRefreshToken } },
        },
      ],
    }).compile();

    repository = module.get(RefreshTokenRepository);
  });

  describe('create', () => {
    it('calls prisma.refreshToken.create with input data and returns the token', async () => {
      const inputCreate = {
        credentialsId: 'cred-id-1',
        tokenHash: 'sha256hash',
        expiresAt: new Date(),
      };
      const expectedToken = mockRefreshToken();
      mockPrismaRefreshToken.create.mockResolvedValue(expectedToken);

      const actualResult = await repository.create(inputCreate);

      expect(mockPrismaRefreshToken.create).toHaveBeenCalledWith({ data: inputCreate });
      expect(actualResult).toEqual(expectedToken);
    });
  });

  describe('findByHash', () => {
    it('returns refresh token when found by hash', async () => {
      const expectedToken = mockRefreshToken();
      mockPrismaRefreshToken.findUnique.mockResolvedValue(expectedToken);

      const actualResult = await repository.findByHash('sha256hash');

      expect(mockPrismaRefreshToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash: 'sha256hash' } });
      expect(actualResult).toEqual(expectedToken);
    });

    it('returns null when token is not found', async () => {
      mockPrismaRefreshToken.findUnique.mockResolvedValue(null);

      const actualResult = await repository.findByHash('unknown-hash');

      expect(actualResult).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('calls prisma.refreshToken.delete with the correct id', async () => {
      mockPrismaRefreshToken.delete.mockResolvedValue({});

      await repository.deleteById('rt-id-1');

      expect(mockPrismaRefreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-id-1' } });
    });
  });

  describe('deleteAllByCredentialsId', () => {
    it('calls prisma.refreshToken.deleteMany with the correct credentialsId', async () => {
      mockPrismaRefreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await repository.deleteAllByCredentialsId('cred-id-1');

      expect(mockPrismaRefreshToken.deleteMany).toHaveBeenCalledWith({
        where: { credentialsId: 'cred-id-1' },
      });
    });
  });
});
