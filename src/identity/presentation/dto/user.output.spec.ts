import { Role } from 'src/common/auth';
import { mockUser } from '../../__fixtures__/identity.fixtures';
import { UserDto } from './user.output';

describe('UserDto', () => {
  describe('fromApplication', () => {
    it('maps all user fields correctly', () => {
      const inputUser = mockUser({
        lastName: 'Doe',
        avatar: 'https://avatar.com/john.png',
      });

      const actualResult = UserDto.fromApplication(inputUser);

      expect(actualResult.id).toBe(inputUser.id);
      expect(actualResult.authId).toBe(inputUser.authId);
      expect(actualResult.firstName).toBe(inputUser.firstName);
      expect(actualResult.lastName).toBe(inputUser.lastName);
      expect(actualResult.email).toBe(inputUser.email);
      expect(actualResult.phone).toBe(inputUser.phone);
      expect(actualResult.avatar).toBe(inputUser.avatar);
      expect(actualResult.roles).toEqual([Role.USER]);
      expect(actualResult.isActive).toBe(true);
      expect(actualResult.createdAt).toBe(inputUser.createdAt);
      expect(actualResult.updatedAt).toBe(inputUser.updatedAt);
    });

    it('defaults lastName to empty string when null', () => {
      const inputUser = mockUser({ lastName: null });

      const actualResult = UserDto.fromApplication(inputUser);

      expect(actualResult.lastName).toBe('');
    });
  });
});
