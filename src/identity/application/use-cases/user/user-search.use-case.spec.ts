import { Test, TestingModule } from '@nestjs/testing';
import { USER_REPOSITORY } from 'src/identity/domain/ports/user.repository.port';
import {
  mockUser,
  mockUserSearchQuery,
  mockPagedResult,
} from 'src/identity/__fixtures__/identity.fixtures';
import { UserSearchUseCase } from './user-search.use-case';

describe('UserSearchUseCase', () => {
  let sut: UserSearchUseCase;
  let mockUserRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockUserRepo = { search: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSearchUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
      ],
    }).compile();

    sut = module.get(UserSearchUseCase);
  });

  describe('execute', () => {
    it('returns paged result from repository', async () => {
      const expectedResult = mockPagedResult([mockUser()]);
      const inputQuery = mockUserSearchQuery();
      mockUserRepo.search.mockResolvedValue(expectedResult);

      const actualResult = await sut.execute(inputQuery);

      expect(actualResult).toEqual(expectedResult);
    });

    it('delegates to the repository with the provided query', async () => {
      const inputQuery = mockUserSearchQuery({ searchTerm: 'John' });
      mockUserRepo.search.mockResolvedValue(mockPagedResult([]));

      await sut.execute(inputQuery);

      expect(mockUserRepo.search).toHaveBeenCalledWith(inputQuery);
    });

    it('returns empty result when no users match', async () => {
      const expectedResult = mockPagedResult([]);
      mockUserRepo.search.mockResolvedValue(expectedResult);

      const actualResult = await sut.execute(mockUserSearchQuery());

      expect(actualResult.data).toHaveLength(0);
    });
  });
});
