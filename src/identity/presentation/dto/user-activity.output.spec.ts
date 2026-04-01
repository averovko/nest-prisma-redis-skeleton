import { UserActivityType } from '../../domain/entities/user-activity.entity';
import { mockUserActivity } from '../../__fixtures__/identity.fixtures';
import { UserActivityDto } from './user-activity.output';

describe('UserActivityDto', () => {
  describe('fromApplication', () => {
    it('maps all activity fields correctly', () => {
      const inputActivity = mockUserActivity({
        performedBy: 'op-1',
        activityType: UserActivityType.LOGIN,
      });

      const actualResult = UserActivityDto.fromApplication(inputActivity);

      expect(actualResult.id).toBe(inputActivity.id);
      expect(actualResult.authId).toBe(inputActivity.authId);
      expect(actualResult.performedBy).toBe('op-1');
      expect(actualResult.activityType).toBe(UserActivityType.LOGIN);
      expect(actualResult.details).toEqual(inputActivity.details);
      expect(actualResult.timestamp).toBe(inputActivity.timestamp);
    });

    it('defaults performedBy to empty string when null', () => {
      const inputActivity = mockUserActivity({ performedBy: null });

      const actualResult = UserActivityDto.fromApplication(inputActivity);

      expect(actualResult.performedBy).toBe('');
    });
  });
});
