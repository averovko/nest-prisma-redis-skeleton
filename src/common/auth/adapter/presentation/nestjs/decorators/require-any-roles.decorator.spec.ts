import { ROLES_KEY, RequireAnyRoles } from './require-any-roles.decorator';
import { Role } from '../../../../domain';

describe('RequireAnyRoles decorator', () => {
  it('returns a SetMetadata decorator with ROLES_KEY and provided roles', () => {
    class TestController {}
    const decorator = RequireAnyRoles(Role.ADMIN, Role.ROOT);
    decorator(TestController);

    const roles = Reflect.getMetadata(ROLES_KEY, TestController);
    expect(roles).toEqual([Role.ADMIN, Role.ROOT]);
  });

  it('stores a single role correctly', () => {
    class TestController {}
    RequireAnyRoles(Role.USER)(TestController);

    const roles = Reflect.getMetadata(ROLES_KEY, TestController);
    expect(roles).toEqual([Role.USER]);
  });

  it('exports ROLES_KEY as the correct string constant', () => {
    expect(ROLES_KEY).toBe('requireAnyRoles');
  });
});
