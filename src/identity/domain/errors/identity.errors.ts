import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';
import { IdentityErrorCode } from './identity.error-codes';

export const IDENTITY_ERRORS: Record<IdentityErrorCode, ErrorDefinition> = {
  [IdentityErrorCode.USER_NOT_FOUND]: {
    message: 'User {{userId}} not found',
    status: HttpStatus.NOT_FOUND,
  },
  [IdentityErrorCode.USER_CREATE_FAILED]: {
    message: 'Failed to create user: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [IdentityErrorCode.USER_UPDATE_FAILED]: {
    message: 'Failed to update user {{userId}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [IdentityErrorCode.USER_DELETE_FAILED]: {
    message: 'Failed to delete user {{userId}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [IdentityErrorCode.USER_QUERY_FAILED]: {
    message: 'Failed to query users: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  [IdentityErrorCode.USER_PROFILE_NOT_FOUND]: {
    message: 'User profile for {{userId}} not found',
    status: HttpStatus.NOT_FOUND,
  },
  [IdentityErrorCode.USER_PROFILE_UPDATE_FAILED]: {
    message: 'Failed to update user profile for {{userId}}: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  [IdentityErrorCode.INVALID_BULK_OPERATION]: {
    message: 'Invalid bulk operation: {{operation}}',
    status: HttpStatus.BAD_REQUEST,
  },

  [IdentityErrorCode.REQUIRE_PERSON]: {
    message: 'Agent must be a person',
    status: HttpStatus.FORBIDDEN,
  },
};
