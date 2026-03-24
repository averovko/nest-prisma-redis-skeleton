import { Role } from './role.enum';

export interface User {
  id: string;
  authId: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
  roles: Role[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
