import { Test, TestingModule } from '@nestjs/testing';
import { AppError } from 'src/common/errors';
import { USER_REPOSITORY } from 'src/identity/domain/ports/user.repository.port';
import { IdentityErrorCode } from 'src/identity/domain/errors/identity.error-codes';
import { mockUser } from 'src/identity/__fixtures__/identity.fixtures';
import { UserGetByIdUseCase } from './user-get-by-id.use-case';

describe('UserGetByIdUseCase', () => {
  let sut: UserGetByIdUseCase;
  let mockUserRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockUserRepo = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGetByIdUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    sut = module.get(UserGetByIdUseCase);
  });

  describe('execute', () => {
    it('returns user when found', async () => {
      const expectedUser = mockUser();
      mockUserRepo.findById.mockResolvedValue(expectedUser);

      const actualResult = await sut.execute(expectedUser.id);

      expect(actualResult).toEqual(expectedUser);
    });

    it('calls repository with the provided userId', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser());

      await sut.execute('user-123');

      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123');
    });

    it('throws USER_NOT_FOUND when user does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(sut.execute('non-existent')).rejects.toMatchObject({
        code: IdentityErrorCode.USER_NOT_FOUND,
      });
    });

    it('throws AppError when user is not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(sut.execute('non-existent')).rejects.toBeInstanceOf(
        AppError,
      );
    });
  });
});
