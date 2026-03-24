import { HttpStatus } from '@nestjs/common';
import { commonErrorMap } from './error.map';

describe('commonErrorMap', () => {
  describe('common namespace', () => {
    it.each([
      'serverError',
      'invalidToken',
      'invalidApiKey',
      'noPrivilege',
      'forbidden',
      'requirePerson',
      'requireUser',
    ])('contains "%s" entry', (key) => {
      expect(commonErrorMap.common).toHaveProperty(key);
    });

    it('serverError has INTERNAL_SERVER_ERROR status', () => {
      const entry = commonErrorMap.common.serverError as {
        status: HttpStatus;
        message: string;
      };

      expect(entry.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(typeof entry.message).toBe('string');
    });

    it('invalidToken has UNAUTHORIZED status', () => {
      const entry = commonErrorMap.common.invalidToken as {
        status: HttpStatus;
        message: string;
      };

      expect(entry.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('noPrivilege has FORBIDDEN status and placeholder in message', () => {
      const entry = commonErrorMap.common.noPrivilege as {
        status: HttpStatus;
        message: string;
      };

      expect(entry.status).toBe(HttpStatus.FORBIDDEN);
      expect(entry.message).toContain('{{roles}}');
    });
  });

  describe('validation namespace', () => {
    it('contains validationFailed entry', () => {
      expect(commonErrorMap.validation).toHaveProperty('validationFailed');
    });

    it('validationFailed has BAD_REQUEST status', () => {
      const entry = commonErrorMap.validation.validationFailed as {
        status: HttpStatus;
        message: string;
      };

      expect(entry.status).toBe(HttpStatus.BAD_REQUEST);
      expect(typeof entry.message).toBe('string');
    });
  });

  describe('entry structure', () => {
    it('all leaf entries have status (number) and message (string)', () => {
      const checkEntries = (obj: Record<string, unknown>, path = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (
            value !== null &&
            typeof value === 'object' &&
            'status' in (value as object) &&
            'message' in (value as object)
          ) {
            const entry = value as { status: unknown; message: unknown };
            expect(typeof entry.status).toBe('number');
            expect(typeof entry.message).toBe('string');
          } else if (typeof value === 'object' && value !== null) {
            checkEntries(value as Record<string, unknown>, currentPath);
          }
        });
      };

      checkEntries(commonErrorMap as unknown as Record<string, unknown>);
    });
  });
});
