jest.mock('../../../identity/domain/entities/role.enum', () => ({
  Role: { USER: 'USER', ADMIN: 'ADMIN', ROOT: 'ROOT' },
}));

jest.mock('class-validator', () => ({
  ...jest.requireActual('class-validator'),
  validateSync: jest.fn().mockReturnValue([]),
}));

import { validateSync, ValidationError } from 'class-validator';
import { EventRegistryService } from './event-registry.service';
import { EventSchema } from '../entities/events/event.interface';
import { EventValidationError } from '../entities/errors/event.errors';

const mockValidateSync = validateSync as jest.MockedFunction<typeof validateSync>;

class MockPayload {
  value: string;
}

const buildSchema = (
  eventName: string,
  module = 'test',
): EventSchema<MockPayload> => ({
  eventName,
  schema: new MockPayload(),
  version: '1.0.0',
  module,
  description: `Schema for ${eventName}`,
});

describe('EventRegistryService', () => {
  let service: EventRegistryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventRegistryService();
  });

  describe('onModuleInit()', () => {
    it('registers all built-in event schemas without throwing', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('registers a non-zero number of event schemas', () => {
      service.onModuleInit();

      expect(service.getAllEventTypes().length).toBeGreaterThan(0);
    });

    it('registers authentication event schemas', () => {
      service.onModuleInit();

      expect(service.hasEventType('authentication.user.registered')).toBe(true);
      expect(service.hasEventType('authentication.user.logged.in')).toBe(true);
    });

    it('registers invitation event schemas', () => {
      service.onModuleInit();

      expect(service.hasEventType('invitation.accepted')).toBe(true);
    });
  });

  describe('registerEventType()', () => {
    it('registers a valid schema without throwing', () => {
      const schema = buildSchema('test.event.created');

      expect(() => service.registerEventType(schema)).not.toThrow();
    });

    it('makes the schema retrievable after registration', () => {
      const schema = buildSchema('test.event.created');
      service.registerEventType(schema);

      expect(service.getEventSchema('test.event.created')).toBe(schema);
    });

    it('throws EventValidationError for missing eventName', () => {
      const schema = { ...buildSchema('test.event'), eventName: '' };

      expect(() => service.registerEventType(schema)).toThrow(
        EventValidationError,
      );
    });

    it('throws EventValidationError for missing schema object', () => {
      const schema = { ...buildSchema('test.event'), schema: null as any };

      expect(() => service.registerEventType(schema)).toThrow(
        EventValidationError,
      );
    });

    it('throws EventValidationError for missing version', () => {
      const schema = { ...buildSchema('test.event'), version: '' };

      expect(() => service.registerEventType(schema)).toThrow(
        EventValidationError,
      );
    });

    it('throws EventValidationError when validateSync returns validation errors', () => {
      const validationError = Object.assign(new ValidationError(), {
        property: 'field',
        constraints: { isUUID: 'must be UUID' },
      });
      mockValidateSync.mockReturnValueOnce([validationError]);

      const schema = buildSchema('test.invalid.schema');

      expect(() => service.registerEventType(schema)).toThrow(
        EventValidationError,
      );
    });

    it('throws EventValidationError when registering a duplicate event name', () => {
      const schema = buildSchema('test.event.duplicate');
      service.registerEventType(schema);

      expect(() => service.registerEventType(schema)).toThrow(
        EventValidationError,
      );
    });
  });

  describe('getEventSchema()', () => {
    it('returns the schema for a registered event', () => {
      const schema = buildSchema('my.event');
      service.registerEventType(schema);

      expect(service.getEventSchema('my.event')).toBe(schema);
    });

    it('returns undefined for an unregistered event', () => {
      expect(service.getEventSchema('nonexistent.event')).toBeUndefined();
    });
  });

  describe('hasEventType()', () => {
    it('returns true for a registered event', () => {
      service.registerEventType(buildSchema('present.event'));

      expect(service.hasEventType('present.event')).toBe(true);
    });

    it('returns false for an unregistered event', () => {
      expect(service.hasEventType('absent.event')).toBe(false);
    });
  });

  describe('getAllEventTypes()', () => {
    it('returns all registered schemas', () => {
      service.registerEventType(buildSchema('event.one'));
      service.registerEventType(buildSchema('event.two'));

      const all = service.getAllEventTypes();

      expect(all.length).toBe(2);
      expect(all.map((s) => s.eventName)).toContain('event.one');
      expect(all.map((s) => s.eventName)).toContain('event.two');
    });

    it('returns empty array when nothing is registered', () => {
      expect(service.getAllEventTypes()).toEqual([]);
    });
  });

  describe('getEventTypesByModule()', () => {
    it('returns only schemas from the specified module', () => {
      service.registerEventType(buildSchema('auth.event', 'auth'));
      service.registerEventType(buildSchema('identity.event', 'identity'));
      service.registerEventType(buildSchema('auth.other', 'auth'));

      const authSchemas = service.getEventTypesByModule('auth');

      expect(authSchemas.length).toBe(2);
      authSchemas.forEach((s) => expect(s.module).toBe('auth'));
    });

    it('returns empty array when no schemas match the module', () => {
      service.registerEventType(buildSchema('auth.event', 'auth'));

      expect(service.getEventTypesByModule('unknown')).toEqual([]);
    });
  });
});
