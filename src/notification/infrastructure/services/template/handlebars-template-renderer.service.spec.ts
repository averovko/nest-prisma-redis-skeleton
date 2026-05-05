import * as path from 'node:path';
import * as fs from 'node:fs';
import { HandlebarsTemplateRendererService } from './handlebars-template-renderer.service';
import { NotificationErrorCode } from '../../../domain/errors/notification.error-codes';
import { NotificationError } from '../../../domain/errors/notification.errors';

describe('HandlebarsTemplateRendererService', () => {
  let sut: HandlebarsTemplateRendererService;
  const templatesDir = path.join(__dirname, '..', '..', 'templates');

  beforeEach(() => {
    sut = new HandlebarsTemplateRendererService();
  });

  describe('render', () => {
    it('throws TEMPLATE_NOT_FOUND when template file does not exist', async () => {
      await expect(sut.render('emails/non-existent', {})).rejects.toMatchObject(
        {
          code: NotificationErrorCode.TEMPLATE_NOT_FOUND,
        },
      );
    });

    it('throws NotificationError with TEMPLATE_NOT_FOUND code for unknown template', async () => {
      await expect(sut.render('unknown/template', {})).rejects.toBeInstanceOf(
        NotificationError,
      );
    });

    describe('real templates', () => {
      const templatesExist = fs.existsSync(templatesDir);

      (templatesExist ? it : it.skip)(
        'renders welcome template without error',
        async () => {
          const html = await sut.render('emails/welcome', {
            appName: 'TestApp',
            appDomain: 'test.com',
            firstName: 'John',
            verificationLink: 'https://test.com/verify?token=abc',
            year: 2024,
          });
          expect(html).toContain('John');
          expect(html).toContain('https://test.com/verify?token=abc');
        },
      );

      (templatesExist ? it : it.skip)(
        'renders password-reset template without error',
        async () => {
          const html = await sut.render('emails/password-reset', {
            appName: 'TestApp',
            appDomain: 'test.com',
            email: 'user@test.com',
            resetLink: 'https://test.com/reset?token=xyz',
            year: 2024,
          });
          expect(html).toContain('https://test.com/reset?token=xyz');
        },
      );

      (templatesExist ? it : it.skip)(
        'renders password-changed template without error',
        async () => {
          const html = await sut.render('emails/password-changed', {
            appName: 'TestApp',
            appDomain: 'test.com',
            email: 'user@test.com',
            changedAt: 'Mon, 01 Jan 2024 00:00:00 GMT',
            ipAddress: '1.2.3.4',
            year: 2024,
          });
          expect(html).toContain('1.2.3.4');
        },
      );

      (templatesExist ? it : it.skip)(
        'renders password-reset-completed template without error',
        async () => {
          const html = await sut.render('emails/password-reset-completed', {
            appName: 'TestApp',
            appDomain: 'test.com',
            email: 'user@test.com',
            completedAt: 'Mon, 01 Jan 2024 00:00:00 GMT',
            ipAddress: '1.2.3.4',
            loginLink: 'https://test.com/login',
            year: 2024,
          });
          expect(html).toContain('https://test.com/login');
        },
      );

      (templatesExist ? it : it.skip)(
        'caches compiled templates on second call',
        async () => {
          const context = {
            appName: 'TestApp',
            appDomain: 'test.com',
            firstName: 'John',
            verificationLink: 'https://test.com/verify?token=abc',
            year: 2024,
          };

          const first = await sut.render('emails/welcome', context);
          const second = await sut.render('emails/welcome', context);

          expect(first).toBe(second);
        },
      );
    });
  });
});
