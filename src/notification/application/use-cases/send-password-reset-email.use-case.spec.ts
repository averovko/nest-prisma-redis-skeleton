import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER_PORT } from '../../domain/ports/email-sender.port';
import { TEMPLATE_RENDERER_PORT } from '../../domain/ports/template-renderer.port';
import { SendPasswordResetEmailUseCase } from './send-password-reset-email.use-case';

describe('SendPasswordResetEmailUseCase', () => {
  let sut: SendPasswordResetEmailUseCase;
  let mockEmailSender: jest.Mocked<any>;
  let mockTemplateRenderer: jest.Mocked<any>;

  const input = {
    email: 'user@example.com',
    rawToken: 'reset-token-xyz',
  };

  beforeEach(async () => {
    mockEmailSender = { send: jest.fn().mockResolvedValue(undefined) };
    mockTemplateRenderer = {
      render: jest.fn().mockResolvedValue('<html>reset</html>'),
    };
    const mockConfigService = {
      get: jest.fn((key: string, def?: unknown) => {
        const config: Record<string, unknown> = {
          'notification.appName': 'TestApp',
          'notification.frontendUrl': 'https://frontend.example.com',
        };
        return config[key] ?? def;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendPasswordResetEmailUseCase,
        { provide: EMAIL_SENDER_PORT, useValue: mockEmailSender },
        { provide: TEMPLATE_RENDERER_PORT, useValue: mockTemplateRenderer },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    sut = module.get(SendPasswordResetEmailUseCase);
  });

  describe('execute', () => {
    it('renders password-reset template with correct context including resetLink', async () => {
      await sut.execute(input);

      expect(mockTemplateRenderer.render).toHaveBeenCalledWith(
        'emails/password-reset',
        expect.objectContaining({
          email: input.email,
          resetLink: `https://frontend.example.com/reset-password?token=${input.rawToken}`,
          appName: 'TestApp',
        }),
      );
    });

    it('sends email to the correct recipient', async () => {
      await sut.execute(input);

      expect(mockEmailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: input.email,
          html: '<html>reset</html>',
        }),
      );
    });

    it('does NOT throw when emailSender fails — swallows error', async () => {
      mockEmailSender.send.mockRejectedValue(new Error('SendGrid error'));

      await expect(sut.execute(input)).resolves.toBeUndefined();
    });

    it('skips sending when email is empty', async () => {
      await sut.execute({ ...input, email: '' });

      expect(mockEmailSender.send).not.toHaveBeenCalled();
    });
  });
});
