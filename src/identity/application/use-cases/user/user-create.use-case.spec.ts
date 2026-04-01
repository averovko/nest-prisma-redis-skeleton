import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager';
import { USER_REPOSITORY } from 'src/identity/domain/ports/user.repository.port';
import { UserCreatedEvent } from 'src/identity/domain/events/user.events';
import { UserUpdatedEvent } from 'src/identity/domain/events/user.events';
import { mockUser } from 'src/identity/__fixtures__/identity.fixtures';
import { UserCreateUseCase } from './user-create.use-case';

describe('UserCreateUseCase', () => {
  let sut: UserCreateUseCase;
  let mockUserRepo: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  const inputCreate = {
    authId: 'auth-id-1',
    name: 'John',
    email: 'john@example.com',
    phoneNumber: undefined,
    avatar: undefined,
  };

  beforeEach(async () => {
    mockUserRepo = {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreateUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
      ],
    }).compile();

    sut = module.get(UserCreateUseCase);
  });

  describe('execute', () => {
    it('creates a new user and publishes UserCreatedEvent when user does not exist', async () => {
      const expectedUser = mockUser({ authId: inputCreate.authId });
      mockUserRepo.findUnique.mockResolvedValue(null);
      mockUserRepo.upsert.mockResolvedValue(expectedUser);

      const actualResult = await sut.execute(inputCreate);

      expect(actualResult).toEqual(expectedUser);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserCreatedEvent),
      );
    });

    it('upserts user and publishes UserUpdatedEvent when user already exists', async () => {
      const existingUser = mockUser({ authId: inputCreate.authId });
      const expectedUser = mockUser({
        authId: inputCreate.authId,
        firstName: inputCreate.name,
      });
      mockUserRepo.findUnique.mockResolvedValue(existingUser);
      mockUserRepo.upsert.mockResolvedValue(expectedUser);

      const actualResult = await sut.execute(inputCreate);

      expect(actualResult).toEqual(expectedUser);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserUpdatedEvent),
      );
    });

    it('looks up user by authId before upsert', async () => {
      mockUserRepo.findUnique.mockResolvedValue(null);
      mockUserRepo.upsert.mockResolvedValue(mockUser());

      await sut.execute(inputCreate);

      expect(mockUserRepo.findUnique).toHaveBeenCalledWith({
        where: { authId: inputCreate.authId },
      });
    });

    it('publishes exactly one event', async () => {
      mockUserRepo.findUnique.mockResolvedValue(null);
      mockUserRepo.upsert.mockResolvedValue(mockUser());

      await sut.execute(inputCreate);

      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });
  });
});
