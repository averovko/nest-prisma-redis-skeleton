import { Inject, Injectable } from '@nestjs/common';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from 'src/identity/domain/ports/user.repository.port';
import {
  EVENT_BUS_TOKEN,
  type EventBusPort,
} from 'src/common/event-manager/application/ports/event-bus.port';
import { type RequestContext } from 'src/common/auth';
import {
  UserActivatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserRoleChangedEvent,
} from 'src/identity/domain/events/user.events';
import {
  BulkOperationType,
  BulkUserOperationDto,
} from '../../dto/bulk-user-operation.dto';
import { BulkOperationResult } from '../../dto/bulk-operation.result';
import { IdentityErrorFactory } from 'src/identity/domain/errors';

@Injectable()
export class UserBulkOperationUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBusPort,
  ) {}

  async execute(
    operation: BulkUserOperationDto,
    operatorAuthId: string,
    requestContext?: RequestContext,
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    const operations = operation.userIds.map(async (userId) => {
      try {
        const subject = await this.userRepository.findById(userId);
        if (!subject) {
          throw IdentityErrorFactory.userNotFound(userId);
        }
        const eventParams = requestContext
          ? { metadata: requestContext }
          : undefined;
        switch (operation.operation) {
          case BulkOperationType.UPDATE_ROLE: {
            await this.userRepository.updateRole(
              userId,
              operation.newRoles ?? [],
            );
            await this.eventBus.publish(
              new UserRoleChangedEvent(
                userId,
                subject.authId,
                operation.newRoles ?? [],
                operatorAuthId,
                eventParams,
              ),
            );
            break;
          }
          case BulkOperationType.DEACTIVATE: {
            await this.userRepository.deactivate(userId);
            await this.eventBus.publish(
              new UserDeactivatedEvent(
                userId,
                subject.authId,
                operatorAuthId,
                eventParams,
              ),
            );
            break;
          }
          case BulkOperationType.ACTIVATE: {
            await this.userRepository.activate(userId);
            await this.eventBus.publish(
              new UserActivatedEvent(
                userId,
                subject.authId,
                operatorAuthId,
                eventParams,
              ),
            );
            break;
          }
          case BulkOperationType.DELETE: {
            try {
              await this.userRepository.delete(userId);
              await this.eventBus.publish(
                new UserDeletedEvent(
                  userId,
                  subject.authId,
                  operatorAuthId,
                  eventParams,
                ),
              );
            } catch (error) {
              throw IdentityErrorFactory.userDeleteFailed(userId, error);
            }
            break;
          }
          default:
            throw IdentityErrorFactory.invalidBulkOperation(
              String(operation.operation),
            );
        }
        result.successCount += 1;
      } catch (error) {
        result.failureCount += 1;
        result.errors.push({
          userId,
          error: error.message,
        });
      }
    });

    await Promise.all(operations);
    return result;
  }
}
