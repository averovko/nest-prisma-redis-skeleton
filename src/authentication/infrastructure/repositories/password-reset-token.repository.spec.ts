import { Test, TestingModule } from '@nestjs/testing';
import { mockPasswordResetToken } from '../../__fixtures__/auth.fixtures';
import { PasswordResetTokenRepository } from './password-reset-token.repository';

jest.mock('src/common/prisma/prisma.service', () => ({
  PrismaService: class MockPrismaService {},
}));

import { PrismaService } from 'src/common/prisma/prisma.service';

describe('PasswordResetTokenRepository', () => {
  let repository: PasswordResetTokenRepository;
  let mockPrismaPasswordResetToken: jest.Mocked<any>;

  beforeEach(async () => {
    mockPrismaPasswordResetToken = {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetTokenRepository,
        {
          provide: PrismaService,
          useValue: { client: { passwordResetToken: mockPrismaPasswordResetToken } },
        },
      ],
    }).compile();

    repository = module.get(PasswordResetTokenRepository);
  });

  describe('create', () => {
    it('calls prisma.passwordResetToken.create with input data and returns the token', async () => {
      const inputCreate = {
        credentialsId: 'cred-id-1',
        tokenHash: 'resethash',
        expiresAt: new Date(),
      };
      const expectedToken = mockPasswordResetToken();
      mockPrismaPasswordResetToken.create.mockResolvedValue(expectedToken);

      const actualResult = await repository.create(inputCreate);

      expect(mockPrismaPasswordResetToken.create).toHaveBeenCalledWith({ data: inputCreate });
      expect(actualResult).toEqual(expectedToken);
    });
  });

  describe('findByHash', () => {
    it('returns the reset token when found by hash', async () => {
      const expectedToken = mockPasswordResetToken();
      mockPrismaPasswordResetToken.findUnique.mockResolvedValue(expectedToken);

      const actualResult = await repository.findByHash('resethash');

      expect(mockPrismaPasswordResetToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: 'resethash' },
      });
      expect(actualResult).toEqual(expectedToken);
    });

    it('returns null when the token is not found', async () => {
      mockPrismaPasswordResetToken.findUnique.mockResolvedValue(null);

      const actualResult = await repository.findByHash('unknown-hash');

      expect(actualResult).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('calls prisma.passwordResetToken.delete with the correct id', async () => {
      mockPrismaPasswordResetToken.delete.mockResolvedValue({});

      await repository.deleteById('prt-id-1');

      expect(mockPrismaPasswordResetToken.delete).toHaveBeenCalledWith({ where: { id: 'prt-id-1' } });
    });
  });

  describe('deleteAllByCredentialsId', () => {
    it('calls prisma.passwordResetToken.deleteMany with the correct credentialsId', async () => {
      mockPrismaPasswordResetToken.deleteMany.mockResolvedValue({ count: 2 });

      await repository.deleteAllByCredentialsId('cred-id-1');

      expect(mockPrismaPasswordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { credentialsId: 'cred-id-1' },
      });
    });
  });
});
