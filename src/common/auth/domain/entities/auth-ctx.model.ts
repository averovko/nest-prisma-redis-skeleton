import { Role } from './role.enum';
import { User } from './user.model';
import { AuthDomainError } from '../errors/auth-domain-error';

export enum AgentType {
  person = 'person',
  service = 'service',
}

export interface Person {
  authId: string;
  email?: string;
  phone?: string;
}

export interface Service {
  id: string;
}

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  device?: string;
  client?: string;
  os?: string;
  [key: string]: unknown;
}

export interface AuthCtxSnapshot {
  agentType: AgentType;
  expireAt?: number;
  person?: Person;
  service?: Service;
  user?: User;
  requestContext?: RequestContext;
}

interface AuthCtxProps {
  agentType: AgentType;
  expireAt?: number;
  person?: Person;
  service?: Service;
  user?: User;
  requestContext?: RequestContext;
}

export class AuthCtx {
  private readonly agentType: AgentType;
  private readonly expireAt?: number;
  private readonly person?: Person;
  private readonly service?: Service;
  private readonly user?: User;
  private readonly requestContext?: RequestContext;

  private constructor(props: AuthCtxProps) {
    this.agentType = props.agentType;
    this.expireAt = props.expireAt;
    this.person = props.person;
    this.service = props.service;
    this.user = props.user;
    this.requestContext = props.requestContext;
  }

  static forPerson(
    person: Person,
    user: User | undefined,
    expireAt?: number,
  ): AuthCtx {
    return new AuthCtx({ agentType: AgentType.person, person, user, expireAt });
  }

  static forService(service: Service, expireAt?: number): AuthCtx {
    return new AuthCtx({ agentType: AgentType.service, service, expireAt });
  }

  static fromSnapshot(snapshot: AuthCtxSnapshot): AuthCtx {
    return new AuthCtx(snapshot);
  }

  withRequestContext(ctx: RequestContext): AuthCtx {
    return new AuthCtx({
      agentType: this.agentType,
      expireAt: this.expireAt,
      person: this.person,
      service: this.service,
      user: this.user,
      requestContext: ctx,
    });
  }

  isPerson(): boolean {
    return !!this.person;
  }

  isService(): boolean {
    return !!this.service;
  }

  isUser(): boolean {
    return !!this.user;
  }

  getAgentType(): AgentType {
    return this.agentType;
  }

  getExpireAt(): number | undefined {
    return this.expireAt;
  }

  getPerson(): Person | undefined {
    return this.person;
  }

  getService(): Service | undefined {
    return this.service;
  }

  getUser(): User | undefined {
    return this.user;
  }

  getRequestContext(): RequestContext | undefined {
    return this.requestContext;
  }

  requireUser(): User {
    if (!this.user) throw new AuthDomainError('require-user');
    return this.user;
  }

  requirePerson(): Person {
    if (!this.person) throw new AuthDomainError('require-person');
    return this.person;
  }

  assertHasAnyRole(roles: Role[]): void {
    const user = this.requireUser();
    if (!roles.some((role) => user.roles.includes(role))) {
      throw new AuthDomainError('no-privilege', { roles: roles.join(', ') });
    }
  }

  toSnapshot(): AuthCtxSnapshot {
    return {
      agentType: this.agentType,
      expireAt: this.expireAt,
      person: this.person,
      service: this.service,
      user: this.user,
      requestContext: this.requestContext,
    };
  }
}
