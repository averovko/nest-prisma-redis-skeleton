import { Test, TestingModule } from '@nestjs/testing';
import { USER_ACTIVITY_REPOSITORY } from 'src/identity/domain/ports/user-activity.repository.port';
import { USER_REPOSITORY } from 'src/identity/domain/ports/user.repository.port';
import {
  mockUser,
  mockUserActivity,
  mockActivitySearchQuery,
  mockPagedResult,
} from 'src/identity/__fixtures__/identity.fixtures';
import { UserActivityGetUseCase } from './user-activity-get.use-case';

describe('UserActivityGetUseCase', () => {
  let sut: UserActivityGetUseCase;
  let mockActivityRepo: jest.Mocked<any>;
  let mockUserRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockActivityRepo = { findByAuthId: jest.fn() };
    mockUserRepo = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivityGetUseCase,
        { provide: USER_ACTIVITY_REPOSITORY, useValue: mockActivityRepo },
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    sut = module.get(UserActivityGetUseCase);
  });

  describe('execute', () => {
    it('returns paged activity result from repository', async () => {
      const expectedUser = mockUser({ id: 'user-1', authId: 'auth-1' });
      const expectedResult = mockPagedResult([mockUserActivity()]);
      const inputQuery = mockActivitySearchQuery();
      mockUserRepo.findById.mockResolvedValue(expectedUser);
      mockActivityRepo.findByAuthId.mockResolvedValue(expectedResult);

      const actualResult = await sut.execute('user-1', inputQuery);

      expect(actualResult).toEqual(expectedResult);
    });

    it('resolves user by id and queries activity by authId', async () => {
      const expectedUser = mockUser({ id: 'user-1', authId: 'auth-xyz' });
      mockUserRepo.findById.mockResolvedValue(expectedUser);
      mockActivityRepo.findByAuthId.mockResolvedValue(mockPagedResult([]));
      const inputQuery = mockActivitySearchQuery({ pageSize: 20 });

      await sut.execute('user-1', inputQuery);

      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-1');
      expect(mockActivityRepo.findByAuthId).toHaveBeenCalledWith(
        'auth-xyz',
        inputQuery,
      );
    });
  });
});
