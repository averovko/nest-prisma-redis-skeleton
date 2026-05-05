import { Role } from 'src/common/auth';
import { User } from '../domain/entities/user.entity';
import {
  UserActivity,
  UserActivityType,
} from '../domain/entities/user-activity.entity';
import { UserSearchQuery } from '../domain/queries/user-search.query';
import { ActivitySearchQuery } from '../domain/queries/activity-search.query';
import { PagedResult } from 'src/common/models';

export const mockUser = (overrides?: Partial<User>): User => ({
  id: 'user-id-1',
  authId: '550e8400-e29b-41d4-a716-446655440001',
  email: 'test@example.com',
  phone: null,
  firstName: 'John',
  lastName: 'Doe',
  avatar: null,
  roles: [Role.USER],
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const mockUserActivity = (
  overrides?: Partial<UserActivity>,
): UserActivity =>
  new UserActivity({
    id: 'activity-id-1',
    authId: '550e8400-e29b-41d4-a716-446655440001',
    activityType: UserActivityType.ACCOUNT_CREATED,
    performedBy: '550e8400-e29b-41d4-a716-446655440001',
    details: {},
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
    ipAddress: null,
    userAgent: null,
    metadata: {},
    success: true,
    location: null,
    device: null,
    client: null,
    os: null,
    ...overrides,
  });

export const mockUserSearchQuery = (
  overrides?: Partial<UserSearchQuery>,
): UserSearchQuery => ({
  pageNumber: 0,
  pageSize: 10,
  ...overrides,
});

export const mockActivitySearchQuery = (
  overrides?: Partial<ActivitySearchQuery>,
): ActivitySearchQuery => ({
  pageNumber: 0,
  pageSize: 10,
  ...overrides,
});

export const mockPagedResult = <T>(
  items: T[],
  overrides?: Partial<PagedResult<T>>,
): PagedResult<T> =>
  new PagedResult(items, {
    pageSize: 10,
    pageNumber: 0,
    totalItems: items.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    ...overrides,
  });
