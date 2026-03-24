import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../../domain';

export const ROLES_KEY = 'requireAnyRoles';
export const RequireAnyRoles = (...roles: Role[]) =>
  SetMetadata(ROLES_KEY, roles);
