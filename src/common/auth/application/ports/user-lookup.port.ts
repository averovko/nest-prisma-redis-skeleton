import { type User } from '../../domain';

export const USER_LOOKUP_PORT = Symbol('UserLookupPort');

export interface UserLookupPort {
  findByAuthId(authId: string): Promise<User | undefined>;
}
