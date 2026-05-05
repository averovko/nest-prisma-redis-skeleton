import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER_PORT } from '../../domain/ports/email-sender.port';
import { TEMPLATE_RENDERER_PORT } from '../../domain/ports/template-renderer.port';
import { SendPasswordResetCompletedEmailUseCase } from './send-password-reset-completed-email.use-case';

describe('SendPasswordResetCompletedEmailUseCase', () => {
  let sut: SendPasswordResetCompletedEmailUseCase;
  let mockEmailSender: jest.Mocked<any>;
  let mockTemplateRenderer: jest.Mocked<any>;

  const input = {
    email: 'user@example.com',
    ipAddress: '5.6.7.8',
    completedAt: 'Mon, 01 Jan 2024 00:00:00 GMT',
  };

  beforeEach(async () => {
    mockEmailSender = { send: jest.fn().mockResolvedValue(undefined) };
    mockTemplateRenderer = {
      render: jest.fn().mockResolvedValue('<html>reset-done</html>'),
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
        SendPasswordResetCompletedEmailUseCase,
        { provide: EMAIL_SENDER_PORT, useValue: mockEmailSender },
        { provide: TEMPLATE_RENDERER_PORT, useValue: mockTemplateRenderer },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    sut = module.get(SendPasswordResetCompletedEmailUseCase);
  });

  describe('execute', () => {
    it('renders password-reset-completed template with correct context', async () => {
      await sut.execute(input);

      expect(mockTemplateRenderer.render).toHaveBeenCalledWith(
        'emails/password-reset-completed',
        expect.objectContaining({
          email: input.email,
          completedAt: input.completedAt,
          ipAddress: input.ipAddress,
          loginLink: 'https://frontend.example.com/login',
        }),
      );
    });

    it('sends email to the correct recipient', async () => {
      await sut.execute(input);

      expect(mockEmailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: input.email,
          html: '<html>reset-done</html>',
        }),
      );
    });

    it('falls back to "Unknown" for ipAddress when not provided', async () => {
      await sut.execute({ email: input.email });

      const context = mockTemplateRenderer.render.mock.calls[0][1];
      expect(context.ipAddress).toBe('Unknown');
    });

    it('does NOT throw when emailSender fails', async () => {
      mockEmailSender.send.mockRejectedValue(new Error('error'));

      await expect(sut.execute(input)).resolves.toBeUndefined();
    });

    it('skips sending when email is empty', async () => {
      await sut.execute({ email: '' });

      expect(mockEmailSender.send).not.toHaveBeenCalled();
    });
  });
});
