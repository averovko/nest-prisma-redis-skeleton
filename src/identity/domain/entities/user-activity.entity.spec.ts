import { UserActivity, UserActivityType } from './user-activity.entity';

describe('UserActivity', () => {
  describe('constructor', () => {
    it('assigns all provided properties', () => {
      const inputData = {
        id: 'act-1',
        authId: 'auth-1',
        activityType: UserActivityType.LOGIN,
        performedBy: 'auth-1',
        details: { key: 'value' },
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        metadata: { extra: 'data' },
        success: true,
        location: 'US',
        device: 'device-1',
        client: 'client-1',
        os: 'os-1',
      };

      const actualActivity = new UserActivity(inputData);

      expect(actualActivity.id).toBe(inputData.id);
      expect(actualActivity.authId).toBe(inputData.authId);
      expect(actualActivity.activityType).toBe(inputData.activityType);
      expect(actualActivity.performedBy).toBe(inputData.performedBy);
      expect(actualActivity.details).toEqual(inputData.details);
      expect(actualActivity.timestamp).toBe(inputData.timestamp);
      expect(actualActivity.ipAddress).toBe(inputData.ipAddress);
      expect(actualActivity.userAgent).toBe(inputData.userAgent);
      expect(actualActivity.metadata).toEqual(inputData.metadata);
      expect(actualActivity.success).toBe(true);
      expect(actualActivity.location).toBe(inputData.location);
      expect(actualActivity.device).toBe(inputData.device);
      expect(actualActivity.client).toBe(inputData.client);
      expect(actualActivity.os).toBe(inputData.os);
    });

    it('sets timestamp to current date when not provided', () => {
      const before = Date.now();
      const actualActivity = new UserActivity({
        id: 'act-1',
        authId: 'auth-1',
      });
      const after = Date.now();

      expect(actualActivity.timestamp.getTime()).toBeGreaterThanOrEqual(before);
      expect(actualActivity.timestamp.getTime()).toBeLessThanOrEqual(after);
    });

    it('defaults details to empty object when not provided', () => {
      const actualActivity = new UserActivity({ id: 'act-1' });

      expect(actualActivity.details).toEqual({});
    });

    it('defaults metadata to empty object when not provided', () => {
      const actualActivity = new UserActivity({ id: 'act-1' });

      expect(actualActivity.metadata).toEqual({});
    });

    it('defaults success to true when not provided', () => {
      const actualActivity = new UserActivity({ id: 'act-1' });

      expect(actualActivity.success).toBe(true);
    });

    it('defaults location to null when not provided', () => {
      const actualActivity = new UserActivity({ id: 'act-1' });

      expect(actualActivity.location).toBeNull();
    });

    it('keeps success as false when explicitly set to false', () => {
      const actualActivity = new UserActivity({ id: 'act-1', success: false });

      expect(actualActivity.success).toBe(false);
    });

    it('keeps provided location value', () => {
      const actualActivity = new UserActivity({ id: 'act-1', location: 'EU' });

      expect(actualActivity.location).toBe('EU');
    });
  });
});
