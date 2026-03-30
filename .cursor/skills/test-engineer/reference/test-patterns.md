# Test Patterns Reference

Testing patterns for each architecture layer based on existing test files in the project.

## Use Case Test Pattern

Mock all injected ports, test business logic in isolation.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from './login.use-case';
import { CREDENTIALS_REPOSITORY, CredentialsRepositoryPort } from '../../domain/ports/credentials.repository.port';
import { EVENT_BUS_TOKEN, EventBusPort } from 'src/common/event-manager/application/ports/event-bus.port';

describe('LoginUseCase', () => {
  let sut: LoginUseCase;
  let mockCredentialsRepo: jest.Mocked<CredentialsRepositoryPort>;
  let mockEventBus: jest.Mocked<EventBusPort>;

  beforeEach(async () => {
    mockCredentialsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByAuthId: jest.fn(),
      existsByEmail: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    mockEventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
        // ... other port mocks
      ],
    }).compile();

    sut = module.get(LoginUseCase);
  });

  it('should return token pair for valid credentials', async () => {
    // Arrange
    const inputLogin = { email: 'test@test.com', password: 'valid' };
    const mockCredentials = { id: '1', authId: 'auth-1', email: 'test@test.com', passwordHash: 'hash' };
    mockCredentialsRepo.findByEmail.mockResolvedValue(mockCredentials);

    // Act
    const actualResult = await sut.execute(inputLogin);

    // Assert
    expect(actualResult).toBeDefined();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('should throw for invalid credentials', async () => {
    // Arrange
    mockCredentialsRepo.findByEmail.mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ email: 'bad@test.com', password: 'wrong' }))
      .rejects.toThrow();
  });
});
```

## Domain Event Test Pattern

Test that events produce correct JSON payload.

```typescript
describe('UserRegisteredEvent', () => {
  it('should produce correct payload', () => {
    // Arrange
    const mockCredentials = { authId: 'auth-1', email: 'test@test.com' };

    // Act
    const actualEvent = new UserRegisteredEvent(mockCredentials);

    // Assert
    expect(actualEvent.eventName).toBe('authentication.user.registered');
    expect(actualEvent.toJSON()).toEqual({
      userId: 'auth-1',
      email: 'test@test.com',
    });
    expect(actualEvent.eventId).toBeDefined();
    expect(actualEvent.metadata.version).toBe('1.0.0');
  });
});
```

## Event Handler Test Pattern

Verify handler delegates to correct use case.

```typescript
describe('UserActivityHandler', () => {
  let sut: UserActivityHandler;
  let mockUserCreatedUseCase: jest.Mocked<UserCreatedUseCase>;

  beforeEach(async () => {
    mockUserCreatedUseCase = { execute: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        UserActivityHandler,
        { provide: UserCreatedUseCase, useValue: mockUserCreatedUseCase },
      ],
    }).compile();

    sut = module.get(UserActivityHandler);
  });

  it('should delegate user created event to use case', async () => {
    // Arrange
    const inputEvent = new UserCreatedEvent({ userId: '1', email: 'test@test.com' });

    // Act
    await sut.handleUserCreated(inputEvent);

    // Assert
    expect(mockUserCreatedUseCase.execute).toHaveBeenCalledWith(inputEvent);
  });
});
```

## Repository Test Pattern

Test Prisma repository methods with mocked PrismaService.

```typescript
describe('CredentialsRepository', () => {
  let sut: CredentialsRepository;
  let mockPrisma: { client: { credentials: Record<string, jest.Mock> } };

  beforeEach(async () => {
    mockPrisma = {
      client: {
        credentials: {
          create: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
        },
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        CredentialsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    sut = module.get(CredentialsRepository);
  });

  it('should create credentials', async () => {
    // Arrange
    const inputCreate = { authId: '1', email: 'test@test.com', passwordHash: 'hash' };
    const expectedCredentials = { id: 'cred-1', ...inputCreate };
    mockPrisma.client.credentials.create.mockResolvedValue(expectedCredentials);

    // Act
    const actualResult = await sut.create(inputCreate);

    // Assert
    expect(actualResult).toEqual(expectedCredentials);
    expect(mockPrisma.client.credentials.create).toHaveBeenCalledWith({ data: inputCreate });
  });
});
```

## Controller Test Pattern

Test controller methods with mocked use cases.

```typescript
describe('AuthenticationController', () => {
  let sut: AuthenticationController;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;

  beforeEach(async () => {
    mockLoginUseCase = { execute: jest.fn() };

    const module = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        { provide: LoginUseCase, useValue: mockLoginUseCase },
      ],
    }).compile();

    sut = module.get(AuthenticationController);
  });

  it('should return token pair DTO on login', async () => {
    // Arrange
    const inputBody = { email: 'test@test.com', password: 'pass' };
    const mockTokenPair = { accessToken: 'at', refreshToken: 'rt' };
    mockLoginUseCase.execute.mockResolvedValue(mockTokenPair);

    // Act
    const actualResult = await sut.login(inputBody);

    // Assert
    expect(actualResult).toBeInstanceOf(TokenPairDto);
  });
});
```

## E2E Test Pattern

Full application bootstrap with HTTP assertions.

```typescript
describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/authentication/register → 201', () => {
    return request(app.getHttpServer())
      .post('/v1/authentication/register')
      .send({ email: 'new@test.com', password: 'SecureP@ss1' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      });
  });
});
```

## Naming Conventions

| Variable | Purpose |
|----------|---------|
| `sut` | System Under Test |
| `input{Action}` | Test input data |
| `mock{Name}` | Mocked dependency or data |
| `expected{Name}` | Expected result value |
| `actual{Name}` | Actual result from execution |
