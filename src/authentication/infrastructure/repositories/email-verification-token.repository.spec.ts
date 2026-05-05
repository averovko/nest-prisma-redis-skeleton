import { Test, TestingModule } from '@nestjs/testing';
import { EmailVerificationTokenRepository } from './email-verification-token.repository';

jest.mock('src/common/prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {},
}));

import { PrismaService } from 'src/common/prisma/prisma.service';

describe('EmailVerificationTokenRepository', () => {
  let repository: EmailVerificationTokenRepository;
  let mockPrismaEmailVerificationToken: jest.Mocked<any>;

  beforeEach(async () => {
    mockPrismaEmailVerificationToken = {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationTokenRepository,
        {
          provide: PrismaService,
          useValue: {
            client: { emailVerificationToken: mockPrismaEmailVerificationToken },
          },
        },
      ],
    }).compile();

    repository = module.get(EmailVerificationTokenRepository);
  });

  describe('create', () => {
    it('calls prisma.emailVerificationToken.create with input data', async () => {
      const inputCreate = {
        credentialsId: 'cred-id-1',
        tokenHash: 'verification-hash',
        expiresAt: new Date(),
      };
      const expectedToken = {
        id: 'evt-id-1',
        credentialsId: inputCreate.credentialsId,
        tokenHash: inputCreate.tokenHash,
        expiresAt: inputCreate.expiresAt,
        createdAt: new Date(),
      };
      mockPrismaEmailVerificationToken.create.mockResolvedValue(expectedToken);

      const actualResult = await repository.create(inputCreate);

      expect(mockPrismaEmailVerificationToken.create).toHaveBeenCalledWith({
        data: inputCreate,
      });
      expect(actualResult).toEqual(expectedToken);
    });
  });

  describe('findByHash', () => {
    it('returns token when found by hash', async () => {
      const expectedToken = {
        id: 'evt-id-1',
        credentialsId: 'cred-id-1',
        tokenHash: 'verification-hash',
        expiresAt: new Date(),
        createdAt: new Date(),
      };
      mockPrismaEmailVerificationToken.findUnique.mockResolvedValue(expectedToken);

      const actualResult = await repository.findByHash('verification-hash');

      expect(mockPrismaEmailVerificationToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: 'verification-hash' },
      });
      expect(actualResult).toEqual(expectedToken);
    });

    it('returns null when token is missing', async () => {
      mockPrismaEmailVerificationToken.findUnique.mockResolvedValue(null);

      const actualResult = await repository.findByHash('missing-hash');

      expect(actualResult).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('calls prisma.emailVerificationToken.delete with token id', async () => {
      mockPrismaEmailVerificationToken.delete.mockResolvedValue({});

      await repository.deleteById('evt-id-1');

      expect(mockPrismaEmailVerificationToken.delete).toHaveBeenCalledWith({
        where: { id: 'evt-id-1' },
      });
    });
  });

  describe('deleteAllByCredentialsId', () => {
    it('calls prisma.emailVerificationToken.deleteMany with credentials id', async () => {
      mockPrismaEmailVerificationToken.deleteMany.mockResolvedValue({ count: 2 });

      await repository.deleteAllByCredentialsId('cred-id-1');

      expect(mockPrismaEmailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: { credentialsId: 'cred-id-1' },
      });
    });
  });
});
