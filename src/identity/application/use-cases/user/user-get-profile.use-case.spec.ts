import { Test, TestingModule } from '@nestjs/testing';
import { AppError } from 'src/common/errors';
import { USER_REPOSITORY } from 'src/identity/domain/ports/user.repository.port';
import { IdentityErrorCode } from 'src/identity/domain/errors/identity.error-codes';
import { mockUser } from 'src/identity/__fixtures__/identity.fixtures';
import { UserGetProfileUseCase } from './user-get-profile.use-case';

describe('UserGetProfileUseCase', () => {
  let sut: UserGetProfileUseCase;
  let mockUserRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockUserRepo = { findUnique: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGetProfileUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    sut = module.get(UserGetProfileUseCase);
  });

  describe('execute', () => {
    it('returns user profile when found', async () => {
      const expectedUser = mockUser();
      mockUserRepo.findUnique.mockResolvedValue(expectedUser);

      const actualResult = await sut.execute(expectedUser.id);

      expect(actualResult).toEqual(expectedUser);
    });

    it('calls repository with the provided userId', async () => {
      mockUserRepo.findUnique.mockResolvedValue(mockUser());

      await sut.execute('user-123');

      expect(mockUserRepo.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('throws USER_PROFILE_NOT_FOUND when user does not exist', async () => {
      mockUserRepo.findUnique.mockResolvedValue(null);

      await expect(sut.execute('non-existent')).rejects.toMatchObject({
        code: IdentityErrorCode.USER_PROFILE_NOT_FOUND,
      });
    });

    it('throws AppError when user is not found', async () => {
      mockUserRepo.findUnique.mockResolvedValue(null);

      await expect(sut.execute('non-existent')).rejects.toBeInstanceOf(
        AppError,
      );
    });
  });
});
