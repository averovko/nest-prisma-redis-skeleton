import { PagedResult } from 'src/common/models';
import { Role } from 'src/common/auth';

import { User } from '../entities/user.entity';
import { UserSearchQuery } from '../queries/user-search.query';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface FindUniqueUserParams {
  where: {
    id?: string;
    authId?: string;
  };
}

export interface UpdateUserParams {
  where: {
    id?: string;
    authId?: string;
  };
  data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar' | 'roles'>>;
}

export interface UpsertUserParams {
  where: {
    authId: string;
  };
  create: Pick<User, 'authId' | 'firstName' | 'roles'> & {
    avatar?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  update: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar'>>;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  findUnique(params: FindUniqueUserParams): Promise<User | null>;
  count(): Promise<number>;
  upsert(params: UpsertUserParams): Promise<User>;
  update(params: UpdateUserParams): Promise<User>;
  search(query: UserSearchQuery): Promise<PagedResult<User>>;
  updateRole(userId: string, role: Role[]): Promise<User>;
  deactivate(userId: string): Promise<User>;
  activate(userId: string): Promise<User>;
  delete(userId: string): Promise<void>;
}
