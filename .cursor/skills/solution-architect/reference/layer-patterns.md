# Layer Patterns Reference

Code patterns from existing modules for each architecture layer.

## Domain Entity (readonly interface)

From `src/authentication/domain/entities/credentials.entity.ts`:

```typescript
export interface Credentials {
  readonly id: string;
  readonly authId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly isVerified: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

## Domain Port (interface + Symbol token)

From `src/authentication/domain/ports/credentials.repository.port.ts`:

```typescript
import { Credentials } from '../entities/credentials.entity';

export const CREDENTIALS_REPOSITORY = Symbol('CREDENTIALS_REPOSITORY');

export interface CreateCredentialsInput {
  authId: string;
  email: string;
  passwordHash: string;
}

export interface CredentialsRepositoryPort {
  create(input: CreateCredentialsInput): Promise<Credentials>;
  findById(id: string): Promise<Credentials | null>;
  findByEmail(email: string): Promise<Credentials | null>;
  existsByEmail(email: string): Promise<boolean>;
}
```

## Domain Event (extending BaseEvent)

From `src/authentication/domain/events/user.events.ts`:

```typescript
import { BaseEvent, AuthenticationEventSchemas } from 'src/common/event-manager';
import { EventMetadata } from 'src/common/event-manager';

export class UserRegisteredEvent extends BaseEvent<
  typeof AuthenticationEventSchemas.USER_REGISTERED.schema
> {
  private readonly eventPayload: typeof AuthenticationEventSchemas.USER_REGISTERED.schema;

  constructor(
    credentials: Credentials,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(AuthenticationEventSchemas.USER_REGISTERED, params);
    this.eventPayload = {
      userId: credentials.authId,
      email: credentials.email,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export { AuthenticationEventSchemas as USER_EVENTS } from 'src/common/event-manager';
```

## Event Schema (in event-manager schemas)

From `src/common/event-manager/application/schemas/authentication.events.ts`:

```typescript
import { IsEmail, IsUUID } from 'class-validator';
import { EventSchema } from '../../domain/events/event.interface';

class BaseAuthenticationPayload {
  @IsUUID()
  userId: string;
}

export class UserRegisteredPayload extends BaseAuthenticationPayload {
  @IsEmail()
  email: string;
}

export const AuthenticationEventSchemas = {
  USER_REGISTERED: {
    eventName: 'authentication.user.registered',
    schema: new UserRegisteredPayload(),
    version: '1.0.0',
    module: 'authentication',
    description: 'Emitted when a new user is registered',
  } as EventSchema<UserRegisteredPayload>,
} as const;
```

## Use Case (injecting ports)

From `src/authentication/application/use-cases/login.use-case.ts`:

```typescript
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(CREDENTIALS_REPOSITORY)
    private readonly credentialsRepository: CredentialsRepositoryPort,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: EventBusPort,
  ) {}

  async execute(input: LoginInput): Promise<TokenPairOutput> {
    const credentials = await this.credentialsRepository.findByEmail(input.email);
    if (!credentials) {
      throw AuthenticationErrorFactory.invalidCredentials();
    }
    // ... business logic ...
    await this.eventBus.publish(new UserLoggedInEvent(credentials));
    return tokenPair;
  }
}
```

## Event Handler (subscribing to events)

From `src/identity/application/handlers/user-activity.handler.ts`:

```typescript
@Injectable()
export class UserActivityHandler {
  constructor(
    private readonly userCreatedUseCase: UserCreatedUseCase,
  ) {}

  @OnEvent(USER_EVENTS.USER_CREATED.eventName)
  handleUserCreated(event: UserCreatedEvent) {
    return this.userCreatedUseCase.execute(event);
  }
}
```

## Infrastructure Repository (implementing port)

From `src/authentication/infrastructure/repositories/credentials.repository.ts`:

```typescript
@Injectable()
export class CredentialsRepository implements CredentialsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCredentialsInput): Promise<Credentials> {
    return this.prisma.client.credentials.create({ data: input });
  }

  async findById(id: string): Promise<Credentials | null> {
    return this.prisma.client.credentials.findUnique({ where: { id } });
  }
}
```

## Controller (presentation layer)

From `src/authentication/presentation/authentication.controller.ts`:

```typescript
@Controller({ path: 'authentication', version: '1' })
@UseFilters(GlobalErrorFilter)
@ApiTags('authentication')
@ErrorResponse(COMMON_PUBLIC_ERRORS)
export class AuthenticationController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @CreatedResponse(TokenPairDto)
  async register(@Body() body: RegisterDto): Promise<TokenPairDto> {
    const tokenPair = await this.registerUseCase.execute(body);
    return TokenPairDto.fromApplication(tokenPair);
  }
}
```

## Module Wiring

From `src/authentication/authentication.module.ts`:

```typescript
@Module({
  imports: [AppConfigModule, JwtModule],
  providers: [
    { provide: CREDENTIALS_REPOSITORY, useClass: CredentialsRepository },
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasher },
    { provide: TOKEN_ISSUER_PORT, useClass: JwtTokenIssuer },
    RegisterUseCase,
    LoginUseCase,
  ],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
```
