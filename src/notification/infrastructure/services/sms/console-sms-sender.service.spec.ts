import { Logger } from '@nestjs/common';
import { ConsoleSmsSenderService } from './console-sms-sender.service';

describe('ConsoleSmsSenderService', () => {
  let sut: ConsoleSmsSenderService;

  beforeEach(() => {
    sut = new ConsoleSmsSenderService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs sms message with expected format', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    await expect(
      sut.send({
        to: '+79001234567',
        body: 'Test SMS body',
      }),
    ).resolves.toBeUndefined();

    expect(loggerSpy).toHaveBeenCalledWith('[SMS] To: +79001234567 | Body: Test SMS body');
  });
});
