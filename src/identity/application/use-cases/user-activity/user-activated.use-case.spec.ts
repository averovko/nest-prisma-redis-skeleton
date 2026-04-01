import { Test, TestingModule } from '@nestjs/testing';
import { USER_ACTIVITY_REPOSITORY } from 'src/identity/domain/ports/user-activity.repository.port';
import { UserActivityType } from 'src/identity/domain/entities';
import { UserActivatedEvent } from 'src/identity/domain/events/user.events';
import { mockUserActivity } from 'src/identity/__fixtures__/identity.fixtures';
import { UserActivatedUseCase } from './user-activated.use-case';

describe('UserActivatedUseCase', () => {
  let sut: UserActivatedUseCase;
  let mockActivityRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockActivityRepo = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivatedUseCase,
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
      ],
    }).compile();

    sut = module.get(UserActivatedUseCase);
  });

  describe('execute', () => {
    it('creates an ACCOUNT_ACTIVATED activity with correct authId and performedBy', async () => {
      const authId = '550e8400-e29b-41d4-a716-446655440001';
      const inputEvent = new UserActivatedEvent('user-1', authId, 'operator-1');
      mockActivityRepo.create.mockResolvedValue(
        mockUserActivity({ activityType: UserActivityType.ACCOUNT_ACTIVATED }),
      );

      await sut.execute(inputEvent);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: UserActivityType.ACCOUNT_ACTIVATED,
          authId,
          performedBy: 'operator-1',
        }),
      );
    });
  });
});
