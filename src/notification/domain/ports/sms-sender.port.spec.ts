import { SMS_SENDER_PORT, SmsSenderPort } from './sms-sender.port';

describe('sms-sender.port', () => {
  it('exports SMS_SENDER_PORT symbol with expected description', () => {
    expect(typeof SMS_SENDER_PORT).toBe('symbol');
    expect(SMS_SENDER_PORT.description).toBe('SMS_SENDER_PORT');
  });

  it('allows a valid SmsSenderPort implementation shape', async () => {
    const sender: SmsSenderPort = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    await expect(sender.send({ to: '+79001234567', body: 'hello' })).resolves.toBeUndefined();
    expect(sender.send).toHaveBeenCalledWith({ to: '+79001234567', body: 'hello' });
  });
});
