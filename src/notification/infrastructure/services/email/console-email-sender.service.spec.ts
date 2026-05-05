import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleEmailSenderService } from './console-email-sender.service';

describe('ConsoleEmailSenderService', () => {
  let sut: ConsoleEmailSenderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsoleEmailSenderService],
    }).compile();

    sut = module.get(ConsoleEmailSenderService);
  });

  describe('send', () => {
    it('resolves without throwing', async () => {
      await expect(
        sut.send({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Hello</p>',
        }),
      ).resolves.toBeUndefined();
    });

    it('does not rethrow when Logger fails', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('logger error');
      });

      await expect(
        sut.send({ to: 'test@example.com', subject: 'Test', html: '<p>Hi</p>' }),
      ).resolves.toBeUndefined();

      jest.restoreAllMocks();
    });
  });
});
