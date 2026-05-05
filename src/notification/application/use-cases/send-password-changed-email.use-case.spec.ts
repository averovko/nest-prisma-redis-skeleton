import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER_PORT } from '../../domain/ports/email-sender.port';
import { TEMPLATE_RENDERER_PORT } from '../../domain/ports/template-renderer.port';
import { SendPasswordChangedEmailUseCase } from './send-password-changed-email.use-case';

describe('SendPasswordChangedEmailUseCase', () => {
  let sut: SendPasswordChangedEmailUseCase;
  let mockEmailSender: jest.Mocked<any>;
  let mockTemplateRenderer: jest.Mocked<any>;

  const input = {
    email: 'user@example.com',
    ipAddress: '1.2.3.4',
    changedAt: 'Mon, 01 Jan 2024 00:00:00 GMT',
  };

  beforeEach(async () => {
    mockEmailSender = { send: jest.fn().mockResolvedValue(undefined) };
    mockTemplateRenderer = {
      render: jest.fn().mockResolvedValue('<html>changed</html>'),
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
        SendPasswordChangedEmailUseCase,
        { provide: EMAIL_SENDER_PORT, useValue: mockEmailSender },
        { provide: TEMPLATE_RENDERER_PORT, useValue: mockTemplateRenderer },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    sut = module.get(SendPasswordChangedEmailUseCase);
  });

  describe('execute', () => {
    it('renders password-changed template with email, changedAt, and ipAddress', async () => {
      await sut.execute(input);

      expect(mockTemplateRenderer.render).toHaveBeenCalledWith(
        'emails/password-changed',
        expect.objectContaining({
          email: input.email,
          changedAt: input.changedAt,
          ipAddress: input.ipAddress,
        }),
      );
    });

    it('falls back to "Unknown" for ipAddress when not provided', async () => {
      await sut.execute({ email: input.email });

      const context = mockTemplateRenderer.render.mock.calls[0][1];
      expect(context.ipAddress).toBe('Unknown');
    });

    it('does NOT throw when emailSender fails', async () => {
      mockEmailSender.send.mockRejectedValue(new Error('SMTP down'));

      await expect(sut.execute(input)).resolves.toBeUndefined();
    });

    it('skips sending when email is empty', async () => {
      await sut.execute({ email: '' });

      expect(mockEmailSender.send).not.toHaveBeenCalled();
    });
  });
});
