import { NotificationChannel } from './notification-channel.enum';

describe('NotificationChannel', () => {
  it('contains EMAIL and SMS channels', () => {
    expect(NotificationChannel.EMAIL).toBe('EMAIL');
    expect(NotificationChannel.SMS).toBe('SMS');
  });

  it('contains only supported channels', () => {
    expect(Object.values(NotificationChannel)).toEqual(['EMAIL', 'SMS']);
  });
});
