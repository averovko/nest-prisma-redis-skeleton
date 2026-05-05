import { Test, TestingModule } from '@nestjs/testing';
import { USER_ACTIVITY_REPOSITORY } from 'src/identity/domain/ports/user-activity.repository.port';
import { UserActivityType } from 'src/identity/domain/entities';
import { UserUpdatedEvent } from 'src/identity/domain/events/user.events';
import {
  mockUser,
  mockUserActivity,
} from 'src/identity/__fixtures__/identity.fixtures';
import { UserUpdatedUseCase } from './user-updated.use-case';

describe('UserUpdatedUseCase', () => {
  let sut: UserUpdatedUseCase;
  let mockActivityRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockActivityRepo = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUpdatedUseCase,
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
      ],
    }).compile();

    sut = module.get(UserUpdatedUseCase);
  });

  describe('execute', () => {
    it('creates a PROFILE_UPDATE activity record from the event', async () => {
      const inputUser = mockUser();
      const inputEvent = new UserUpdatedEvent(inputUser);
      const expectedActivity = mockUserActivity({
        activityType: UserActivityType.PROFILE_UPDATE,
      });
      mockActivityRepo.create.mockResolvedValue(expectedActivity);

      await sut.execute(inputEvent);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: UserActivityType.PROFILE_UPDATE,
          authId: inputUser.authId,
        }),
      );
    });
  });
});
