import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER_PORT } from '../../domain/ports/email-sender.port';
import { TEMPLATE_RENDERER_PORT } from '../../domain/ports/template-renderer.port';
import { SendWelcomeEmailUseCase } from './send-welcome-email.use-case';

describe('SendWelcomeEmailUseCase', () => {
  let sut: SendWelcomeEmailUseCase;
  let mockEmailSender: jest.Mocked<any>;
  let mockTemplateRenderer: jest.Mocked<any>;
  let mockConfigService: jest.Mocked<any>;

  const input = {
    email: 'john@example.com',
    firstName: 'John',
    verificationToken: 'abc123token',
  };

  beforeEach(async () => {
    mockEmailSender = { send: jest.fn().mockResolvedValue(undefined) };
    mockTemplateRenderer = {
      render: jest.fn().mockResolvedValue('<html>welcome</html>'),
    };
    mockConfigService = {
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
        SendWelcomeEmailUseCase,
        { provide: EMAIL_SENDER_PORT, useValue: mockEmailSender },
        { provide: TEMPLATE_RENDERER_PORT, useValue: mockTemplateRenderer },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    sut = module.get(SendWelcomeEmailUseCase);
  });

  describe('execute', () => {
    it('renders welcome template with correct context', async () => {
      await sut.execute(input);

      expect(mockTemplateRenderer.render).toHaveBeenCalledWith(
        'emails/welcome',
        expect.objectContaining({
          firstName: input.firstName,
          appName: 'TestApp',
          verificationLink: expect.stringContaining(input.verificationToken),
        }),
      );
    });

    it('sends email to the correct recipient with welcome subject', async () => {
      await sut.execute(input);

      expect(mockEmailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: input.email,
          subject: expect.stringContaining('TestApp'),
          html: '<html>welcome</html>',
        }),
      );
    });

    it('builds verificationLink using frontendUrl and token', async () => {
      await sut.execute(input);

      const renderCall = mockTemplateRenderer.render.mock.calls[0][1];
      expect(renderCall.verificationLink).toBe(
        `https://frontend.example.com/verify-email?token=${input.verificationToken}`,
      );
    });

    it('does NOT throw when emailSender fails — swallows error', async () => {
      mockEmailSender.send.mockRejectedValue(new Error('SMTP down'));

      await expect(sut.execute(input)).resolves.toBeUndefined();
    });

    it('does NOT throw when templateRenderer fails — swallows error', async () => {
      mockTemplateRenderer.render.mockRejectedValue(
        new Error('template not found'),
      );

      await expect(sut.execute(input)).resolves.toBeUndefined();
    });

    it('skips sending when email is empty', async () => {
      await sut.execute({ ...input, email: '' });

      expect(mockEmailSender.send).not.toHaveBeenCalled();
      expect(mockTemplateRenderer.render).not.toHaveBeenCalled();
    });
  });
});
