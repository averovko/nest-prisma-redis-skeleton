import { Test, TestingModule } from '@nestjs/testing';
import { USER_ACTIVITY_REPOSITORY } from 'src/identity/domain/ports/user-activity.repository.port';
import { UserActivityType } from 'src/identity/domain/entities';
import { UserRoleChangedEvent } from 'src/identity/domain/events/user.events';
import { Role } from 'src/common/auth';
import { mockUserActivity } from 'src/identity/__fixtures__/identity.fixtures';
import { UserRoleChangedUseCase } from './user-role-changed.use-case';

describe('UserRoleChangedUseCase', () => {
  let sut: UserRoleChangedUseCase;
  let mockActivityRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockActivityRepo = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleChangedUseCase,
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
      ],
    }).compile();

    sut = module.get(UserRoleChangedUseCase);
  });

  describe('execute', () => {
    it('creates a ROLE_CHANGE activity with new roles in metadata', async () => {
      const inputRoles = [Role.ADMIN];
      const authId = '550e8400-e29b-41d4-a716-446655440001';
      const inputEvent = new UserRoleChangedEvent(
        'user-1',
        authId,
        inputRoles,
        'operator-1',
      );
      const expectedActivity = mockUserActivity({
        activityType: UserActivityType.ROLE_CHANGE,
      });
      mockActivityRepo.create.mockResolvedValue(expectedActivity);

      await sut.execute(inputEvent);

      expect(mockActivityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: UserActivityType.ROLE_CHANGE,
          authId,
          performedBy: 'operator-1',
          metadata: { newRoles: inputRoles },
        }),
      );
    });
  });
});
