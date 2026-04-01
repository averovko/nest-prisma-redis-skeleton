import { Role } from 'src/common/auth';

export enum BulkOperationType {
  UPDATE_ROLE = 'UPDATE_ROLE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  DELETE = 'DELETE',
}

export class BulkUserOperationDto {
  operation: BulkOperationType;
  userIds: string[];
  newRoles?: Role[] = [];
}
