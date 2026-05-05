import { Test, TestingModule } from '@nestjs/testing';
import { AppError } from 'src/common/errors';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager';
import { USER_REPOSITORY } from 'src/identity/domain/ports/user.repository.port';
import { IdentityErrorCode } from 'src/identity/domain/errors/identity.error-codes';
import { UserUpdatedEvent } from 'src/identity/domain/events/user.events';
import { mockUser } from 'src/identity/__fixtures__/identity.fixtures';
import { UserUpdateProfileUseCase } from './user-update-profile.use-case';

describe('UserUpdateProfileUseCase', () => {
  let sut: UserUpdateProfileUseCase;
  let mockUserRepo: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  const inputProfile = { name: 'Jane', avatar: 'https://avatar.com/jane.png' };

  beforeEach(async () => {
    mockUserRepo = { findUnique: jest.fn(), update: jest.fn() };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUpdateProfileUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
      ],
    }).compile();

    sut = module.get(UserUpdateProfileUseCase);
  });

  describe('execute', () => {
    it('updates profile and publishes UserUpdatedEvent', async () => {
      const existingUser = mockUser();
      const updatedUser = mockUser({ firstName: inputProfile.name });
      mockUserRepo.findUnique.mockResolvedValue(existingUser);
      mockUserRepo.update.mockResolvedValue(updatedUser);

      const actualResult = await sut.execute(existingUser.id, inputProfile);

      expect(actualResult).toEqual(updatedUser);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserUpdatedEvent),
      );
    });

    it('calls repository update with name and avatar', async () => {
      const existingUser = mockUser();
      mockUserRepo.findUnique.mockResolvedValue(existingUser);
      mockUserRepo.update.mockResolvedValue(existingUser);

      await sut.execute(existingUser.id, inputProfile);

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existingUser.id },
          data: expect.objectContaining({
            firstName: inputProfile.name,
            avatar: inputProfile.avatar,
          }),
        }),
      );
    });

    it('throws USER_NOT_FOUND when user does not exist', async () => {
      mockUserRepo.findUnique.mockResolvedValue(null);

      await expect(
        sut.execute('non-existent', inputProfile),
      ).rejects.toMatchObject({
        code: IdentityErrorCode.USER_NOT_FOUND,
      });
    });

    it('does not update or publish event when user is not found', async () => {
      mockUserRepo.findUnique.mockResolvedValue(null);

      await expect(
        sut.execute('non-existent', inputProfile),
      ).rejects.toBeInstanceOf(AppError);

      expect(mockUserRepo.update).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('throws USER_UPDATE_FAILED when update operation fails', async () => {
      mockUserRepo.findUnique.mockResolvedValue(mockUser());
      mockUserRepo.update.mockRejectedValue(new Error('db error'));

      await expect(sut.execute('user-1', inputProfile)).rejects.toMatchObject({
        code: IdentityErrorCode.USER_UPDATE_FAILED,
      });
    });
  });
});
