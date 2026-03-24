import {
  AuthCtx,
  AgentType,
  type Person,
  type Service,
  type AuthCtxSnapshot,
} from '../index';
import { type User } from '../index';
import { Role } from '../index';
import { AuthDomainError } from '../errors/auth-domain-error';

const mockPerson: Person = { authId: 'auth-1', email: 'a@b.com', phone: '+1' };

const mockUser: User = {
  id: 'usr-1',
  authId: 'auth-1',
  email: 'a@b.com',
  phone: '+1',
  firstName: 'Alice',
  lastName: 'Smith',
  avatar: null,
  roles: [Role.USER],
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockService: Service = { id: 'svc-1' };

describe('AuthCtx', () => {
  describe('forPerson', () => {
    it('creates a person context with user', () => {
      const actual = AuthCtx.forPerson(mockPerson, mockUser, 9999);

      expect(actual.isPerson()).toBe(true);
      expect(actual.isService()).toBe(false);
      expect(actual.isUser()).toBe(true);
      expect(actual.getAgentType()).toBe(AgentType.person);
      expect(actual.getPerson()).toEqual(mockPerson);
      expect(actual.getUser()).toEqual(mockUser);
      expect(actual.getExpireAt()).toBe(9999);
    });

    it('creates a person context without user', () => {
      const actual = AuthCtx.forPerson(mockPerson, undefined);

      expect(actual.isPerson()).toBe(true);
      expect(actual.isUser()).toBe(false);
      expect(actual.getUser()).toBeUndefined();
      expect(actual.getExpireAt()).toBeUndefined();
    });
  });

  describe('forService', () => {
    it('creates a service context', () => {
      const actual = AuthCtx.forService(mockService, 5000);

      expect(actual.isService()).toBe(true);
      expect(actual.isPerson()).toBe(false);
      expect(actual.isUser()).toBe(false);
      expect(actual.getAgentType()).toBe(AgentType.service);
      expect(actual.getService()).toEqual(mockService);
      expect(actual.getExpireAt()).toBe(5000);
    });
  });

  describe('fromSnapshot / toSnapshot', () => {
    it('round-trips a person snapshot', () => {
      const original = AuthCtx.forPerson(mockPerson, mockUser, 9999);
      const snapshot = original.toSnapshot();
      const restored = AuthCtx.fromSnapshot(snapshot);

      expect(restored.toSnapshot()).toEqual(snapshot);
    });

    it('round-trips a service snapshot', () => {
      const original = AuthCtx.forService(mockService, 5000);
      const snapshot = original.toSnapshot();
      const restored = AuthCtx.fromSnapshot(snapshot);

      expect(restored.toSnapshot()).toEqual(snapshot);
    });

    it('produces correct snapshot shape', () => {
      const actual = AuthCtx.forPerson(mockPerson, mockUser, 9999);
      const expectedSnapshot: AuthCtxSnapshot = {
        agentType: AgentType.person,
        expireAt: 9999,
        person: mockPerson,
        service: undefined,
        user: mockUser,
      };

      expect(actual.toSnapshot()).toEqual(expectedSnapshot);
    });
  });

  describe('requireUser', () => {
    it('returns user when present', () => {
      const ctx = AuthCtx.forPerson(mockPerson, mockUser);

      expect(ctx.requireUser()).toEqual(mockUser);
    });

    it('throws AuthDomainError when user is absent', () => {
      const ctx = AuthCtx.forPerson(mockPerson, undefined);

      expect(() => ctx.requireUser()).toThrow(AuthDomainError);
      expect(() => ctx.requireUser()).toThrow(
        expect.objectContaining({ code: 'require-user' }),
      );
    });
  });

  describe('requirePerson', () => {
    it('returns person when present', () => {
      const ctx = AuthCtx.forPerson(mockPerson, undefined);

      expect(ctx.requirePerson()).toEqual(mockPerson);
    });

    it('throws AuthDomainError when person is absent', () => {
      const ctx = AuthCtx.forService(mockService);

      expect(() => ctx.requirePerson()).toThrow(AuthDomainError);
      expect(() => ctx.requirePerson()).toThrow(
        expect.objectContaining({ code: 'require-person' }),
      );
    });
  });

  describe('assertHasAnyRole', () => {
    it('passes when user has one of the required roles', () => {
      const ctx = AuthCtx.forPerson(mockPerson, mockUser);

      expect(() => ctx.assertHasAnyRole([Role.USER])).not.toThrow();
    });

    it('passes when user has at least one matching role', () => {
      const ctx = AuthCtx.forPerson(mockPerson, mockUser);

      expect(() => ctx.assertHasAnyRole([Role.ADMIN, Role.USER])).not.toThrow();
    });

    it('throws no-privilege when user has none of the required roles', () => {
      const ctx = AuthCtx.forPerson(mockPerson, mockUser);

      expect(() => ctx.assertHasAnyRole([Role.ADMIN, Role.ROOT])).toThrow(
        AuthDomainError,
      );
      expect(() => ctx.assertHasAnyRole([Role.ADMIN, Role.ROOT])).toThrow(
        expect.objectContaining({
          code: 'no-privilege',
          params: { roles: 'ADMIN, ROOT' },
        }),
      );
    });

    it('throws require-user when there is no user', () => {
      const ctx = AuthCtx.forPerson(mockPerson, undefined);

      expect(() => ctx.assertHasAnyRole([Role.USER])).toThrow(
        expect.objectContaining({ code: 'require-user' }),
      );
    });
  });
});
