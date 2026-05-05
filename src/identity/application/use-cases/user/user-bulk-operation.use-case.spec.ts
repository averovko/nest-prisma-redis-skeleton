import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager';
import { USER_REPOSITORY } from 'src/identity/domain/ports/user.repository.port';
import {
  UserActivatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserRoleChangedEvent,
} from 'src/identity/domain/events/user.events';
import { Role } from 'src/common/auth';
import { BulkOperationType } from '../../dto/bulk-user-operation.dto';
import { UserBulkOperationUseCase } from './user-bulk-operation.use-case';
import { mockUser } from 'src/identity/__fixtures__/identity.fixtures';

describe('UserBulkOperationUseCase', () => {
  let sut: UserBulkOperationUseCase;
  let mockUserRepo: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  const inputOperatorId = 'operator-id-1';

  beforeEach(async () => {
    mockUserRepo = {
      findById: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(mockUser({ id, authId: `auth-${id}` })),
        ),
      updateRole: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
      delete: jest.fn(),
    };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserBulkOperationUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
      ],
    }).compile();

    sut = module.get(UserBulkOperationUseCase);
  });

  describe('execute - UPDATE_ROLE', () => {
    it('updates roles and publishes UserRoleChangedEvent for each user', async () => {
      mockUserRepo.updateRole.mockResolvedValue({});

      const actualResult = await sut.execute(
        {
          operation: BulkOperationType.UPDATE_ROLE,
          userIds: ['user-1', 'user-2'],
          newRoles: [Role.ADMIN],
        },
        inputOperatorId,
      );

      expect(actualResult.successCount).toBe(2);
      expect(actualResult.failureCount).toBe(0);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserRoleChangedEvent),
      );
    });
  });

  describe('execute - DEACTIVATE', () => {
    it('deactivates users and publishes UserDeactivatedEvent for each user', async () => {
      mockUserRepo.deactivate.mockResolvedValue({});

      const actualResult = await sut.execute(
        { operation: BulkOperationType.DEACTIVATE, userIds: ['user-1'] },
        inputOperatorId,
      );

      expect(actualResult.successCount).toBe(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserDeactivatedEvent),
      );
    });
  });

  describe('execute - ACTIVATE', () => {
    it('activates users and publishes UserActivatedEvent for each user', async () => {
      mockUserRepo.activate.mockResolvedValue({});

      const actualResult = await sut.execute(
        { operation: BulkOperationType.ACTIVATE, userIds: ['user-1'] },
        inputOperatorId,
      );

      expect(actualResult.successCount).toBe(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserActivatedEvent),
      );
    });
  });

  describe('execute - DELETE', () => {
    it('deletes users and publishes UserDeletedEvent for each user', async () => {
      mockUserRepo.delete.mockResolvedValue(undefined);

      const actualResult = await sut.execute(
        { operation: BulkOperationType.DELETE, userIds: ['user-1'] },
        inputOperatorId,
      );

      expect(actualResult.successCount).toBe(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(UserDeletedEvent),
      );
    });

    it('counts failures when delete throws', async () => {
      mockUserRepo.delete.mockRejectedValue(new Error('db error'));

      const actualResult = await sut.execute(
        { operation: BulkOperationType.DELETE, userIds: ['user-1'] },
        inputOperatorId,
      );

      expect(actualResult.failureCount).toBe(1);
      expect(actualResult.successCount).toBe(0);
      expect(actualResult.errors).toHaveLength(1);
    });
  });

  describe('execute - partial failures', () => {
    it('tracks both successes and failures for mixed results', async () => {
      mockUserRepo.activate
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('not found'));

      const actualResult = await sut.execute(
        {
          operation: BulkOperationType.ACTIVATE,
          userIds: ['user-1', 'user-2'],
        },
        inputOperatorId,
      );

      expect(actualResult.successCount).toBe(1);
      expect(actualResult.failureCount).toBe(1);
    });
  });

  describe('execute - requestContext forwarding', () => {
    it('forwards requestContext as event metadata for UPDATE_ROLE', async () => {
      mockUserRepo.updateRole.mockResolvedValue({});
      const requestContext = { ipAddress: '1.1.1.1', userAgent: 'BulkAgent' };

      await sut.execute(
        {
          operation: BulkOperationType.UPDATE_ROLE,
          userIds: ['user-1'],
          newRoles: [Role.ADMIN],
        },
        inputOperatorId,
        requestContext,
      );

      const publishedEvent: UserRoleChangedEvent =
        mockEventBus.publish.mock.calls[0][0];
      expect(publishedEvent.metadata.metadata).toEqual(requestContext);
    });

    it('forwards requestContext as event metadata for DEACTIVATE', async () => {
      mockUserRepo.deactivate.mockResolvedValue({});
      const requestContext = { ipAddress: '2.2.2.2' };

      await sut.execute(
        { operation: BulkOperationType.DEACTIVATE, userIds: ['user-1'] },
        inputOperatorId,
        requestContext,
      );

      const publishedEvent: UserDeactivatedEvent =
        mockEventBus.publish.mock.calls[0][0];
      expect(publishedEvent.metadata.metadata).toEqual(requestContext);
    });
  });
});
