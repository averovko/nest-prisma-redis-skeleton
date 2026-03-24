import { AuthCtx, type Person, type User, Role } from '../../domain';
import { AuthAppError } from '../errors/auth-app-error';
import { extractUser, extractPerson, assertRoles } from './auth-ctx-facade';

const stubPerson: Person = { authId: 'auth-1', email: 'test@test.com' };

const stubUser: User = {
  id: 'user-1',
  authId: 'auth-1',
  email: 'test@test.com',
  phone: null,
  firstName: 'Test',
  lastName: null,
  avatar: null,
  roles: [Role.USER],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('auth-ctx-facade', () => {
  describe('extractUser', () => {
    it('returns User when present', () => {
      const authCtx = AuthCtx.forPerson(stubPerson, stubUser);

      expect(extractUser(authCtx)).toEqual(stubUser);
    });

    it('throws AuthAppError require-user when no user', () => {
      const authCtx = AuthCtx.forPerson(stubPerson, undefined);

      expect(() => extractUser(authCtx)).toThrow(AuthAppError);
      expect(() => extractUser(authCtx)).toThrow(
        expect.objectContaining({ code: 'require-user' }),
      );
    });
  });

  describe('extractPerson', () => {
    it('returns Person when present', () => {
      const authCtx = AuthCtx.forPerson(stubPerson, stubUser);

      expect(extractPerson(authCtx)).toEqual(stubPerson);
    });

    it('throws AuthAppError require-person when no person', () => {
      const authCtx = AuthCtx.forService({ id: 'svc-1' });

      expect(() => extractPerson(authCtx)).toThrow(AuthAppError);
      expect(() => extractPerson(authCtx)).toThrow(
        expect.objectContaining({ code: 'require-person' }),
      );
    });
  });

  describe('assertRoles', () => {
    it('passes when user has required role', () => {
      const authCtx = AuthCtx.forPerson(stubPerson, stubUser);

      expect(() => assertRoles(authCtx, [Role.USER])).not.toThrow();
    });

    it('throws AuthAppError no-privilege when user lacks role', () => {
      const authCtx = AuthCtx.forPerson(stubPerson, stubUser);

      expect(() => assertRoles(authCtx, [Role.ADMIN])).toThrow(AuthAppError);
      expect(() => assertRoles(authCtx, [Role.ADMIN])).toThrow(
        expect.objectContaining({ code: 'no-privilege' }),
      );
    });

    it('throws AuthAppError require-user when no user', () => {
      const authCtx = AuthCtx.forPerson(stubPerson, undefined);

      expect(() => assertRoles(authCtx, [Role.USER])).toThrow(AuthAppError);
      expect(() => assertRoles(authCtx, [Role.USER])).toThrow(
        expect.objectContaining({ code: 'require-user' }),
      );
    });

    it('throws AuthAppError server-error when assertHasAnyRole throws unexpected error', () => {
      const authCtx = AuthCtx.forPerson(stubPerson, stubUser);
      jest.spyOn(authCtx, 'assertHasAnyRole').mockImplementation(() => {
        throw new Error('unexpected');
      });

      expect(() => assertRoles(authCtx, [Role.USER])).toThrow(AuthAppError);
      expect(() => assertRoles(authCtx, [Role.USER])).toThrow(
        expect.objectContaining({ code: 'server-error' }),
      );
    });
  });
});

describe('extractUser server-error branch', () => {
  it('throws AuthAppError server-error when requireUser throws unexpected error', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'a' }, stubUser);
    jest.spyOn(authCtx, 'requireUser').mockImplementation(() => {
      throw new Error('unexpected');
    });

    expect(() => extractUser(authCtx)).toThrow(AuthAppError);
    expect(() => extractUser(authCtx)).toThrow(
      expect.objectContaining({ code: 'server-error' }),
    );
  });
});

describe('extractPerson server-error branch', () => {
  it('throws AuthAppError server-error when requirePerson throws unexpected error', () => {
    const authCtx = AuthCtx.forPerson({ authId: 'a' }, stubUser);
    jest.spyOn(authCtx, 'requirePerson').mockImplementation(() => {
      throw new Error('unexpected');
    });

    expect(() => extractPerson(authCtx)).toThrow(AuthAppError);
    expect(() => extractPerson(authCtx)).toThrow(
      expect.objectContaining({ code: 'server-error' }),
    );
  });
});
