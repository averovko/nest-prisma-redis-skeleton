import { Test, TestingModule } from '@nestjs/testing';
import { USER_ACTIVITY_REPOSITORY } from 'src/identity/domain/ports/user-activity.repository.port';
import { UserActivityType } from 'src/identity/domain/entities';
import { UserCreatedEvent } from 'src/identity/domain/events/user.events';
import { mockUser, mockUserActivity } from 'src/identity/__fixtures__/identity.fixtures';
import { UserCreatedUseCase } from './user-created.use-case';

describe('UserCreatedUseCase', () => {
  let sut: UserCreatedUseCase;
  let mockActivityRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockActivityRepo = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreatedUseCase,
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
      ],
    }).compile();

    sut = module.get(UserCreatedUseCase);
  });

  describe('execute', () => {
    it('creates an ACCOUNT_CREATED activity record from the event', async () => {
      const inputUser = mockUser();
      const inputEvent = new UserCreatedEvent(inputUser);
      const expectedActivity = mockUserActivity({
        activityType: UserActivityType.ACCOUNT_CREATED,
      });
      mockActivityRepo.create.mockResolvedValue(expectedActivity);

      const actualResult = await sut.execute(inputEvent);

      expect(actualResult).toEqual(expectedActivity);
      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: UserActivityType.ACCOUNT_CREATED,
          authId: inputUser.authId,
        }),
      );
    });
  });
});
