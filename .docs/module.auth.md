# Auth Module — Complete Implementation Guide

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Directory Structure](#2-directory-structure)
3. [Domain Layer](#3-domain-layer)
   - 3.1 [Value Objects](#31-value-objects)
   - 3.2 [Entities](#32-entities)
   - 3.3 [Domain Events](#33-domain-events)
   - 3.4 [Repository Interfaces](#34-repository-interfaces)
4. [Application Layer](#4-application-layer)
   - 4.1 [Ports](#41-ports)
   - 4.2 [DTOs](#42-dtos)
   - 4.3 [Use Cases](#43-use-cases)
5. [Infrastructure Layer](#5-infrastructure-layer)
   - 5.1 [Repositories](#51-repositories)
   - 5.2 [Services](#52-services)
   - 5.3 [HTTP Layer](#53-http-layer)
6. [RBAC — Permissions & Roles](#6-rbac--permissions--roles)
7. [Error Handling](#7-error-handling)
8. [Testing Strategy](#8-testing-strategy)
9. [Module Bootstrap](#9-module-bootstrap)
10. [Data Flow Diagrams](#10-data-flow-diagrams)

---

## 1. Module Overview

The Auth module is the security foundation of the entire ERP system. Every other module delegates authentication and authorization decisions to this module.

**Responsibilities:**

- User registration and credential management
- Login with email and password
- JWT access token issuance (15-minute TTL)
- Refresh token rotation with stolen token detection (7-day TTL)
- Role-Based Access Control (RBAC) — roles and permission resolution
- Module-level access control (coarse-grained: which modules a user can enter)
- Publishing domain events consumed by other modules (e.g. HR creates an employee → Auth auto-creates a user account)

**What this module does NOT do:**

- It does not store employee profile data — that belongs to the HR module
- It does not handle email delivery — it publishes events; a Notification module handles the actual sending
- It does not manage tenant configuration — that belongs to a future Tenant module

**Dependencies:**

| Dependency | Source | Purpose |
|---|---|---|
| `Result<T>` | `@erp/shared/kernel` | Error handling without exceptions |
| `AggregateRoot` | `@erp/shared/kernel` | Domain event recording |
| `DomainEvent` | `@erp/shared/kernel` | Base class for all events |
| `IEventBus` | `@erp/core/event-bus` | Publishing events to other modules |
| `ApiResponse` | `@erp/core/http` | Standard HTTP response envelope |

This module tags: `scope:module`, `domain:auth`, `type:module`

---

## 2. Directory Structure

```
modules/auth/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   └── RefreshToken.ts
│   │   ├── value-objects/
│   │   │   ├── Email.ts
│   │   │   └── Password.ts
│   │   ├── repositories/
│   │   │   ├── IUserRepository.ts
│   │   │   └── IRefreshTokenRepository.ts
│   │   └── events/
│   │       ├── UserCreated.ts
│   │       ├── UserLoggedIn.ts
│   │       ├── UserDeactivated.ts
│   │       ├── RefreshTokenRotated.ts
│   │       └── TokenFamilyCompromised.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── LoginUseCase.ts
│   │   │   ├── RegisterUseCase.ts
│   │   │   ├── RefreshTokenUseCase.ts
│   │   │   ├── LogoutUseCase.ts
│   │   │   └── DeactivateUserUseCase.ts
│   │   ├── dtos/
│   │   │   ├── LoginDTO.ts
│   │   │   ├── RegisterDTO.ts
│   │   │   └── RefreshTokenDTO.ts
│   │   └── ports/
│   │       ├── ITokenService.ts
│   │       └── IPermissionResolver.ts
│   │
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   ├── PostgresUserRepository.ts
│   │   │   └── PostgresRefreshTokenRepository.ts
│   │   ├── services/
│   │   │   ├── JwtTokenService.ts
│   │   │   └── PermissionResolver.ts
│   │   └── http/
│   │       ├── AuthController.ts
│   │       ├── AuthRoutes.ts
│   │       └── middlewares/
│   │           ├── authenticate.middleware.ts
│   │           └── AuthErrorMapper.ts
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── domain/
│   │   │   │   ├── Email.test.ts
│   │   │   │   ├── Password.test.ts
│   │   │   │   ├── User.test.ts
│   │   │   │   └── RefreshToken.test.ts
│   │   │   └── use-cases/
│   │   │       ├── LoginUseCase.test.ts
│   │   │       ├── RegisterUseCase.test.ts
│   │   │       ├── RefreshTokenUseCase.test.ts
│   │   │       └── LogoutUseCase.test.ts
│   │   └── integration/
│   │       └── AuthRoutes.test.ts
│   │
│   └── AuthModule.ts
│
└── project.json
```

---

## 3. Domain Layer

The domain layer has zero dependencies on frameworks, databases, or HTTP. It contains pure business rules only. This is the most stable layer — it changes only when business rules change.

### 3.1 Value Objects

Value objects are immutable. Two value objects with the same value are considered equal. They are never created in an invalid state — construction either succeeds with a valid object or fails with an explicit error code.

#### Email

```typescript
// domain/value-objects/Email.ts

import { Result } from '@erp/shared/kernel';

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Email> {
    if (!raw || raw.trim().length === 0) {
      return Result.fail('EMAIL_EMPTY');
    }

    const normalized = raw.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized)) {
      return Result.fail('EMAIL_INVALID_FORMAT');
    }

    return Result.ok(new Email(normalized));
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

**Rules enforced:**
- Cannot be empty or whitespace-only
- Must match a valid email format
- Always normalized to lowercase — `USER@TEST.COM` becomes `user@test.com`
- Immutable after creation

---

#### Password

```typescript
// domain/value-objects/Password.ts

import bcrypt from 'bcrypt';
import { Result } from '@erp/shared/kernel';

const SALT_ROUNDS = 12;

export class Password {
  private constructor(
    private readonly _value:    string,
    private readonly _isHashed: boolean,
  ) {}

  // ── Factory: from raw user input ────────────────────────────
  static create(raw: string): Result<Password> {
    if (!raw || raw.length < 8) {
      return Result.fail('PASSWORD_TOO_SHORT');
    }

    const hasUppercase = /[A-Z]/.test(raw);
    const hasNumber    = /[0-9]/.test(raw);
    const hasSpecial   = /[^A-Za-z0-9]/.test(raw);

    if (!hasUppercase || !hasNumber || !hasSpecial) {
      return Result.fail('PASSWORD_TOO_WEAK');
    }

    return Result.ok(new Password(raw, false));
  }

  // ── Factory: from database (already hashed) ─────────────────
  static fromHashed(hashed: string): Password {
    return new Password(hashed, true);
  }

  async hash(): Promise<string> {
    if (this._isHashed) return this._value;
    return bcrypt.hash(this._value, SALT_ROUNDS);
  }

  async compare(raw: string): Promise<boolean> {
    if (!this._isHashed) {
      throw new Error('Cannot compare against an unhashed password');
    }
    return bcrypt.compare(raw, this._value);
  }
}
```

**Rules enforced:**
- Minimum 8 characters
- Must contain at least one uppercase letter, one number, and one special character
- `create()` is for raw input — it validates and stores plaintext for later hashing
- `fromHashed()` is for reconstituting from database — bypasses validation
- Raw password is never exposed after hashing
- Comparison is always done via bcrypt — no direct string comparison

---

### 3.2 Entities

Entities have identity (an `id`) that persists over time. Their state can change but their identity cannot. Entities that produce domain events extend `AggregateRoot`.

#### User

```typescript
// domain/entities/User.ts

import { AggregateRoot, Result } from '@erp/shared/kernel';
import { Email }                 from '../value-objects/Email';
import { Password }              from '../value-objects/Password';
import { UserCreated }           from '../events/UserCreated';
import { UserDeactivated }       from '../events/UserDeactivated';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'GUEST';

interface CreateUserProps {
  email:    string;
  password: string;
  role:     UserRole;
}

interface UserState {
  id:        string;
  email:     Email;
  password:  Password;
  role:      UserRole;
  isActive:  boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private constructor(private state: UserState) {
    super();
  }

  // ── Accessors ────────────────────────────────────────────────
  get id():        string   { return this.state.id; }
  get email():     Email    { return this.state.email; }
  get password():  Password { return this.state.password; }
  get role():      UserRole { return this.state.role; }
  get isActive():  boolean  { return this.state.isActive; }
  get createdAt(): Date     { return this.state.createdAt; }
  get updatedAt(): Date     { return this.state.updatedAt; }

  // ── Factory: new user ────────────────────────────────────────
  static create(props: CreateUserProps): Result<User> {
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure()) return Result.fail(emailResult.getError());

    const passwordResult = Password.create(props.password);
    if (passwordResult.isFailure()) return Result.fail(passwordResult.getError());

    const now  = new Date();
    const user = new User({
      id:        crypto.randomUUID(),
      email:     emailResult.getValue(),
      password:  passwordResult.getValue(),
      role:      props.role,
      isActive:  true,
      createdAt: now,
      updatedAt: now,
    });

    // Record event — published AFTER the entity is persisted
    user.recordEvent(new UserCreated(user.id, user.email.value, user.role));

    return Result.ok(user);
  }

  // ── Factory: reconstitute from database ─────────────────────
  // Does NOT trigger domain events — this is a rehydration, not a creation
  static reconstitute(state: UserState): User {
    return new User(state);
  }

  // ── Behaviour ────────────────────────────────────────────────
  deactivate(): Result<void> {
    if (!this.state.isActive) {
      return Result.fail('USER_ALREADY_INACTIVE');
    }

    this.state.isActive  = false;
    this.state.updatedAt = new Date();
    this.recordEvent(new UserDeactivated(this.id, this.email.value));

    return Result.ok(undefined);
  }

  changeRole(newRole: UserRole): Result<void> {
    if (this.state.role === newRole) {
      return Result.fail('ROLE_UNCHANGED');
    }

    this.state.role      = newRole;
    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
```

**Business rules enforced:**
- A user cannot be created with an invalid email or weak password
- A user cannot be deactivated if already inactive
- `reconstitute()` is strictly for rehydrating from persistence — it never fires events
- Passwords are never stored as plaintext — always hashed before persisting

---

#### RefreshToken

```typescript
// domain/entities/RefreshToken.ts

import { AggregateRoot, Result } from '@erp/shared/kernel';
import { RefreshTokenRotated }   from '../events/RefreshTokenRotated';

const REFRESH_TOKEN_TTL_DAYS = 7;

interface RefreshTokenState {
  id:            string;
  userId:        string;
  familyId:      string;       // All tokens from one login session share this
  parentTokenId: string | null;
  isUsed:        boolean;
  isRevoked:     boolean;
  expiresAt:     Date;
  createdAt:     Date;
}

export class RefreshToken extends AggregateRoot {
  private constructor(private state: RefreshTokenState) {
    super();
  }

  // ── Accessors ────────────────────────────────────────────────
  get id():            string      { return this.state.id; }
  get userId():        string      { return this.state.userId; }
  get familyId():      string      { return this.state.familyId; }
  get parentTokenId(): string|null { return this.state.parentTokenId; }
  get isUsed():        boolean     { return this.state.isUsed; }
  get isRevoked():     boolean     { return this.state.isRevoked; }
  get expiresAt():     Date        { return this.state.expiresAt; }

  // ── Factories ────────────────────────────────────────────────
  static create(userId: string): RefreshToken {
    return new RefreshToken({
      id:            crypto.randomUUID(),
      userId,
      familyId:      crypto.randomUUID(),   // starts a new family
      parentTokenId: null,
      isUsed:        false,
      isRevoked:     false,
      expiresAt:     RefreshToken.ttlFromNow(),
      createdAt:     new Date(),
    });
  }

  static createChild(parent: RefreshToken): RefreshToken {
    return new RefreshToken({
      id:            crypto.randomUUID(),
      userId:        parent.userId,
      familyId:      parent.familyId,       // inherits the same family
      parentTokenId: parent.id,
      isUsed:        false,
      isRevoked:     false,
      expiresAt:     RefreshToken.ttlFromNow(),
      createdAt:     new Date(),
    });
  }

  static reconstitute(state: RefreshTokenState): RefreshToken {
    return new RefreshToken(state);
  }

  // ── Behaviour ────────────────────────────────────────────────
  use(): Result<void> {
    if (this.state.isRevoked) return Result.fail('TOKEN_REVOKED');
    if (this.state.isUsed)    return Result.fail('TOKEN_ALREADY_USED');
    if (this.isExpired())     return Result.fail('TOKEN_EXPIRED');

    this.state.isUsed = true;
    this.recordEvent(new RefreshTokenRotated(this.id, this.userId));

    return Result.ok(undefined);
  }

  revoke(): void {
    this.state.isRevoked = true;
  }

  // Returns true when an already-used token is presented again.
  // This is the stolen token signal: someone is replaying a consumed token.
  isReuse(): boolean {
    return this.state.isUsed && !this.state.isRevoked;
  }

  private isExpired(): boolean {
    return new Date() > this.state.expiresAt;
  }

  private static ttlFromNow(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  }
}
```

**Token Family concept:**
Every login creates a new token family (`familyId`). Each refresh rotates to a child token that inherits the same `familyId`. If a token that has already been used is presented again (reuse detection), the entire family is revoked — forcing both the legitimate user and any attacker to re-authenticate.

---

### 3.3 Domain Events

All domain events extend `DomainEvent` from `@erp/shared/kernel`. They are recorded on the aggregate root during business operations and published to the event bus after successful persistence.

```typescript
// domain/events/UserCreated.ts
import { DomainEvent } from '@erp/shared/kernel';

export class UserCreated extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email:  string,
    public readonly role:   string,
  ) {
    super('auth.user.created');
  }
}
```

```typescript
// domain/events/UserLoggedIn.ts
import { DomainEvent } from '@erp/shared/kernel';

export class UserLoggedIn extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email:  string,
  ) {
    super('auth.user.logged_in');
  }
}
```

```typescript
// domain/events/UserDeactivated.ts
import { DomainEvent } from '@erp/shared/kernel';

export class UserDeactivated extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email:  string,
  ) {
    super('auth.user.deactivated');
  }
}
```

```typescript
// domain/events/RefreshTokenRotated.ts
import { DomainEvent } from '@erp/shared/kernel';

export class RefreshTokenRotated extends DomainEvent {
  constructor(
    public readonly tokenId: string,
    public readonly userId:  string,
  ) {
    super('auth.token.rotated');
  }
}
```

```typescript
// domain/events/TokenFamilyCompromised.ts
import { DomainEvent } from '@erp/shared/kernel';

export class TokenFamilyCompromised extends DomainEvent {
  constructor(
    public readonly familyId: string,
    public readonly userId:   string,
    public readonly reason:   string,
  ) {
    super('auth.token-family.compromised');
  }
}
```

**Event naming convention:** `<module>.<entity>.<action>` — all lowercase, dot-separated.

---

### 3.4 Repository Interfaces

Repository interfaces live in the domain layer. They define what persistence operations the domain needs — not how they are implemented. This keeps the domain layer free of any database concerns.

```typescript
// domain/repositories/IUserRepository.ts

import { User } from '../entities/User';

export interface IUserRepository {
  findById(id: string):         Promise<User | null>;
  findByEmail(email: string):   Promise<User | null>;
  save(user: User, hashedPassword: string): Promise<void>;
  update(user: User):           Promise<void>;
}
```

```typescript
// domain/repositories/IRefreshTokenRepository.ts

import { RefreshToken } from '../entities/RefreshToken';

export interface IRefreshTokenRepository {
  findById(id: string):                    Promise<RefreshToken | null>;
  findByFamilyId(familyId: string):        Promise<RefreshToken[]>;
  save(token: RefreshToken):               Promise<void>;
  revokeAllInFamily(familyId: string):     Promise<void>;
  revokeAllByUserId(userId: string):       Promise<void>;
}
```

---

## 4. Application Layer

The application layer orchestrates domain objects and ports to fulfill use cases. It has no knowledge of HTTP, databases, or any specific framework. It only depends on the domain layer and port interfaces.

### 4.1 Ports

Ports are interfaces that define what the application layer needs from the outside world. Concrete implementations live in the infrastructure layer.

```typescript
// application/ports/ITokenService.ts

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub:          string;     // userId
  email:        string;
  role:         string;
  permissions:  string[];
  moduleAccess: string[];
}

export interface RefreshTokenPayload {
  tokenId: string;
  userId:  string;
}

export interface ITokenService {
  generatePair(
    userId:  string,
    payload: Omit<AccessTokenPayload, 'sub'>,
    tokenId: string,
  ): Promise<TokenPair>;

  verifyAccessToken(token: string):   Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string):  Promise<RefreshTokenPayload>;
}
```

```typescript
// application/ports/IPermissionResolver.ts

import { UserRole } from '../domain/entities/User';

export interface IPermissionResolver {
  getPermissions(role: UserRole):  string[];
  getModuleAccess(role: UserRole): string[];
}
```

---

### 4.2 DTOs

DTOs (Data Transfer Objects) define the shape of data entering use cases. They have no business logic — they are plain objects.

```typescript
// application/dtos/LoginDTO.ts
export interface LoginDTO {
  email:    string;
  password: string;
}

// application/dtos/RegisterDTO.ts
export interface RegisterDTO {
  email:    string;
  password: string;
  role:     UserRole;
}

// application/dtos/RefreshTokenDTO.ts
export interface RefreshTokenDTO {
  refreshToken: string;
}
```

---

### 4.3 Use Cases

Each use case represents exactly one business action. It accepts a DTO and returns `Result<T>`. It never throws for business errors — all failure paths are explicit return values.

#### LoginUseCase

```typescript
// application/use-cases/LoginUseCase.ts

import { IUseCase, Result }         from '@erp/shared/kernel';
import { IEventBus }                from '@erp/core/event-bus';
import { IUserRepository }          from '../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository }  from '../../domain/repositories/IRefreshTokenRepository';
import { ITokenService, TokenPair } from '../ports/ITokenService';
import { IPermissionResolver }      from '../ports/IPermissionResolver';
import { RefreshToken }             from '../../domain/entities/RefreshToken';
import { UserLoggedIn }             from '../../domain/events/UserLoggedIn';
import { LoginDTO }                 from '../dtos/LoginDTO';

export class LoginUseCase implements IUseCase<LoginDTO, Result<TokenPair>> {
  constructor(
    private readonly userRepo:        IUserRepository,
    private readonly tokenRepo:       IRefreshTokenRepository,
    private readonly tokenService:    ITokenService,
    private readonly permResolver:    IPermissionResolver,
    private readonly eventBus:        IEventBus,
  ) {}

  async execute(dto: LoginDTO): Promise<Result<TokenPair>> {
    // 1. Find user — same error for not-found and wrong password (security)
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) return Result.fail('INVALID_CREDENTIALS');

    // 2. Check account status before verifying password
    if (!user.isActive) return Result.fail('USER_INACTIVE');

    // 3. Verify password
    const isMatch = await user.password.compare(dto.password);
    if (!isMatch) return Result.fail('INVALID_CREDENTIALS');

    // 4. Create new refresh token (starts a new token family)
    const refreshToken = RefreshToken.create(user.id);
    await this.tokenRepo.save(refreshToken);

    // 5. Resolve permissions and generate token pair
    const permissions  = this.permResolver.getPermissions(user.role);
    const moduleAccess = this.permResolver.getModuleAccess(user.role);

    const tokens = await this.tokenService.generatePair(
      user.id,
      { email: user.email.value, role: user.role, permissions, moduleAccess },
      refreshToken.id,
    );

    // 6. Publish event — after all side effects succeed
    await this.eventBus.publish(new UserLoggedIn(user.id, user.email.value));

    return Result.ok(tokens);
  }
}
```

---

#### RegisterUseCase

```typescript
// application/use-cases/RegisterUseCase.ts

import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus }        from '@erp/core/event-bus';
import { IUserRepository }  from '../../domain/repositories/IUserRepository';
import { User }             from '../../domain/entities/User';
import { RegisterDTO }      from '../dtos/RegisterDTO';

export interface RegisterResult {
  id:    string;
  email: string;
  role:  string;
}

export class RegisterUseCase implements IUseCase<RegisterDTO, Result<RegisterResult>> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: RegisterDTO): Promise<Result<RegisterResult>> {
    // 1. Guard: duplicate email
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) return Result.fail('EMAIL_ALREADY_EXISTS');

    // 2. Create user — validation happens inside the domain
    const userResult = User.create({
      email:    dto.email,
      password: dto.password,
      role:     dto.role,
    });
    if (userResult.isFailure()) return Result.fail(userResult.getError());

    const user = userResult.getValue();

    // 3. Hash password before persisting — never store plaintext
    const hashedPassword = await user.password.hash();
    await this.userRepo.save(user, hashedPassword);

    // 4. Pull and publish domain events recorded by the entity
    const events = user.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({ id: user.id, email: user.email.value, role: user.role });
  }
}
```

---

#### RefreshTokenUseCase

The most security-critical use case in the module. Implements full token rotation with stolen token detection via the token family mechanism.

```typescript
// application/use-cases/RefreshTokenUseCase.ts

import { IUseCase, Result }            from '@erp/shared/kernel';
import { IEventBus }                   from '@erp/core/event-bus';
import { IRefreshTokenRepository }     from '../../domain/repositories/IRefreshTokenRepository';
import { IUserRepository }             from '../../domain/repositories/IUserRepository';
import { ITokenService, TokenPair }    from '../ports/ITokenService';
import { IPermissionResolver }         from '../ports/IPermissionResolver';
import { RefreshToken }                from '../../domain/entities/RefreshToken';
import { TokenFamilyCompromised }      from '../../domain/events/TokenFamilyCompromised';
import { RefreshTokenDTO }             from '../dtos/RefreshTokenDTO';

export class RefreshTokenUseCase implements IUseCase<RefreshTokenDTO, Result<TokenPair>> {
  constructor(
    private readonly tokenRepo:    IRefreshTokenRepository,
    private readonly userRepo:     IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly permResolver: IPermissionResolver,
    private readonly eventBus:     IEventBus,
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<Result<TokenPair>> {
    // ── Step 1: Verify JWT signature ─────────────────────────────
    // If the JWT itself is malformed, expired at JWT level, or tampered
    let tokenId: string;
    let userId:  string;

    try {
      const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
      tokenId = payload.tokenId;
      userId  = payload.userId;
    } catch {
      return Result.fail('TOKEN_INVALID');
    }

    // ── Step 2: Find token record in database ────────────────────
    const token = await this.tokenRepo.findById(tokenId);
    if (!token) return Result.fail('TOKEN_INVALID');

    // ── Step 3: Stolen token detection ───────────────────────────
    // A token that has already been used is being presented again.
    // We cannot know which party is legitimate → revoke the entire family.
    // Both the real user and attacker will be forced to log in again.
    if (token.isReuse()) {
      await this.tokenRepo.revokeAllInFamily(token.familyId);

      await this.eventBus.publish(new TokenFamilyCompromised(
        token.familyId,
        userId,
        'REFRESH_TOKEN_REUSE_DETECTED',
      ));

      return Result.fail('REFRESH_TOKEN_REUSED');
    }

    // ── Step 4: Validate token state ─────────────────────────────
    const useResult = token.use();
    if (useResult.isFailure()) return Result.fail(useResult.getError());

    // ── Step 5: Persist old token as used ────────────────────────
    await this.tokenRepo.save(token);

    // ── Step 6: Create and persist child token (rotation) ────────
    const childToken = RefreshToken.createChild(token);
    await this.tokenRepo.save(childToken);

    // ── Step 7: Re-fetch user to get current permissions ─────────
    // Permissions may have changed since the original login
    const user = await this.userRepo.findById(userId);
    if (!user) return Result.fail('USER_NOT_FOUND');
    if (!user.isActive) return Result.fail('USER_INACTIVE');

    const permissions  = this.permResolver.getPermissions(user.role);
    const moduleAccess = this.permResolver.getModuleAccess(user.role);

    // ── Step 8: Issue new token pair ─────────────────────────────
    const tokenPair = await this.tokenService.generatePair(
      userId,
      { email: user.email.value, role: user.role, permissions, moduleAccess },
      childToken.id,
    );

    return Result.ok(tokenPair);
  }
}
```

---

#### LogoutUseCase

```typescript
// application/use-cases/LogoutUseCase.ts

import { IUseCase, Result }        from '@erp/shared/kernel';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { ITokenService }           from '../ports/ITokenService';

interface LogoutDTO {
  refreshToken: string;
  allDevices:   boolean;   // true = logout from all sessions
}

export class LogoutUseCase implements IUseCase<LogoutDTO, Result<void>> {
  constructor(
    private readonly tokenRepo:    IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: LogoutDTO): Promise<Result<void>> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);

      if (dto.allDevices) {
        // Revoke all sessions for this user across all devices
        await this.tokenRepo.revokeAllByUserId(payload.userId);
      } else {
        // Revoke only the current session's token family
        const token = await this.tokenRepo.findById(payload.tokenId);
        if (token) {
          await this.tokenRepo.revokeAllInFamily(token.familyId);
        }
      }
    } catch {
      // Even if the token is already invalid, logout is still a success.
      // The client's cookie will be cleared regardless.
    }

    return Result.ok(undefined);
  }
}
```

---

## 5. Infrastructure Layer

The infrastructure layer contains all the concrete implementations of the interfaces defined in the domain and application layers. It depends on external libraries, databases, and frameworks.

### 5.1 Repositories

```typescript
// infrastructure/repositories/PostgresUserRepository.ts

import { Pool }             from 'pg';
import { IUserRepository }  from '../../domain/repositories/IUserRepository';
import { User }             from '../../domain/entities/User';
import { Email }            from '../../domain/value-objects/Email';
import { Password }         from '../../domain/value-objects/Password';

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db
      .query('SELECT * FROM auth.users WHERE id = $1 AND deleted_at IS NULL', [id])
      .then(r => r.rows[0]);

    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .query('SELECT * FROM auth.users WHERE email = $1 AND deleted_at IS NULL', [email])
      .then(r => r.rows[0]);

    return row ? this.toEntity(row) : null;
  }

  async save(user: User, hashedPassword: string): Promise<void> {
    await this.db.query(
      `INSERT INTO auth.users (id, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id,
        user.email.value,
        hashedPassword,
        user.role,
        user.isActive,
        user.createdAt,
        user.updatedAt,
      ],
    );
  }

  async update(user: User): Promise<void> {
    await this.db.query(
      `UPDATE auth.users
       SET role = $2, is_active = $3, updated_at = $4
       WHERE id = $1`,
      [user.id, user.role, user.isActive, user.updatedAt],
    );
  }

  // ── Mapper: DB row → Domain entity ──────────────────────────
  private toEntity(row: Record<string, any>): User {
    return User.reconstitute({
      id:        row.id,
      email:     Email.create(row.email).getValue(),
      password:  Password.fromHashed(row.password_hash),
      role:      row.role,
      isActive:  row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
```

```typescript
// infrastructure/repositories/PostgresRefreshTokenRepository.ts

import { Pool }                    from 'pg';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { RefreshToken }            from '../../domain/entities/RefreshToken';

export class PostgresRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const row = await this.db
      .query('SELECT * FROM auth.refresh_tokens WHERE id = $1', [id])
      .then(r => r.rows[0]);

    return row ? this.toEntity(row) : null;
  }

  async findByFamilyId(familyId: string): Promise<RefreshToken[]> {
    const rows = await this.db
      .query('SELECT * FROM auth.refresh_tokens WHERE family_id = $1', [familyId])
      .then(r => r.rows);

    return rows.map(this.toEntity);
  }

  async save(token: RefreshToken): Promise<void> {
    await this.db.query(
      `INSERT INTO auth.refresh_tokens
         (id, user_id, family_id, parent_token_id, is_used, is_revoked, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
         SET is_used = EXCLUDED.is_used, is_revoked = EXCLUDED.is_revoked`,
      [
        token.id,
        token.userId,
        token.familyId,
        token.parentTokenId,
        token.isUsed,
        token.isRevoked,
        token.expiresAt,
        token.createdAt ?? new Date(),
      ],
    );
  }

  async revokeAllInFamily(familyId: string): Promise<void> {
    await this.db.query(
      'UPDATE auth.refresh_tokens SET is_revoked = true WHERE family_id = $1',
      [familyId],
    );
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.db.query(
      'UPDATE auth.refresh_tokens SET is_revoked = true WHERE user_id = $1',
      [userId],
    );
  }

  private toEntity(row: Record<string, any>): RefreshToken {
    return RefreshToken.reconstitute({
      id:            row.id,
      userId:        row.user_id,
      familyId:      row.family_id,
      parentTokenId: row.parent_token_id,
      isUsed:        row.is_used,
      isRevoked:     row.is_revoked,
      expiresAt:     row.expires_at,
      createdAt:     row.created_at,
    });
  }
}
```

---

### 5.2 Services

#### JwtTokenService

```typescript
// infrastructure/services/JwtTokenService.ts

import jwt                          from 'jsonwebtoken';
import { ITokenService, TokenPair } from '../../application/ports/ITokenService';
import type { AccessTokenPayload, RefreshTokenPayload } from '../../application/ports/ITokenService';

interface JwtConfig {
  accessTokenSecret:   string;
  refreshTokenSecret:  string;
  accessTokenTtl:      string;   // e.g. '15m'
  refreshTokenTtl:     string;   // e.g. '7d'
}

export class JwtTokenService implements ITokenService {
  constructor(private readonly config: JwtConfig) {}

  async generatePair(
    userId:  string,
    payload: Omit<AccessTokenPayload, 'sub'>,
    tokenId: string,
  ): Promise<TokenPair> {
    const accessToken = jwt.sign(
      { sub: userId, ...payload },
      this.config.accessTokenSecret,
      { expiresIn: this.config.accessTokenTtl },
    );

    // Refresh token payload is intentionally minimal —
    // only tokenId for DB lookup, nothing sensitive
    const refreshToken = jwt.sign(
      { tokenId, userId },
      this.config.refreshTokenSecret,
      { expiresIn: this.config.refreshTokenTtl },
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return jwt.verify(token, this.config.accessTokenSecret) as AccessTokenPayload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return jwt.verify(token, this.config.refreshTokenSecret) as RefreshTokenPayload;
  }
}
```

#### PermissionResolver

```typescript
// infrastructure/services/PermissionResolver.ts

import { IPermissionResolver } from '../../application/ports/IPermissionResolver';
import { UserRole }            from '../../domain/entities/User';

// Static permission map — in a future iteration this could be database-driven
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],   // wildcard — all permissions
  ADMIN: [
    'hr:employees:read', 'hr:employees:write', 'hr:employees:delete',
    'hr:departments:read', 'hr:departments:write',
    'inventory:products:read', 'inventory:products:write',
    'inventory:stock:adjust',
    'finance:invoices:read', 'finance:invoices:write',
    'finance:reports:read',
    'ga:assets:read', 'ga:assets:write',
    'ga:procurement-requests:approve',
  ],
  MANAGER: [
    'hr:employees:read', 'hr:employees:write',
    'hr:departments:read',
    'inventory:products:read',
    'inventory:stock:adjust',
    'finance:invoices:read',
    'finance:reports:read',
    'ga:assets:read',
    'ga:procurement-requests:approve',
  ],
  EMPLOYEE: [
    'hr:employees:read',
    'inventory:products:read',
    'ga:assets:read',
  ],
  GUEST: [
    'inventory:products:read',
  ],
};

const ROLE_MODULE_ACCESS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['auth', 'hr', 'inventory', 'finance', 'ga'],
  ADMIN:       ['auth', 'hr', 'inventory', 'finance', 'ga'],
  MANAGER:     ['hr', 'inventory', 'finance', 'ga'],
  EMPLOYEE:    ['hr', 'inventory', 'ga'],
  GUEST:       ['inventory'],
};

export class PermissionResolver implements IPermissionResolver {
  getPermissions(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role] ?? [];
  }

  getModuleAccess(role: UserRole): string[] {
    return ROLE_MODULE_ACCESS[role] ?? [];
  }
}
```

---

### 5.3 HTTP Layer

#### AuthErrorMapper

Centralizes the mapping from domain error codes to HTTP status codes and human-readable messages. Controllers never hard-code status codes.

```typescript
// infrastructure/http/AuthErrorMapper.ts

interface ErrorMeta {
  status:  number;
  message: string;
}

const errorMap: Record<string, ErrorMeta> = {
  // Credentials
  INVALID_CREDENTIALS:   { status: 401, message: 'Invalid email or password' },
  USER_INACTIVE:         { status: 403, message: 'Account is inactive. Contact your administrator' },
  USER_NOT_FOUND:        { status: 404, message: 'User not found' },
  EMAIL_ALREADY_EXISTS:  { status: 409, message: 'This email is already registered' },
  USER_ALREADY_INACTIVE: { status: 409, message: 'Account is already inactive' },
  ROLE_UNCHANGED:        { status: 409, message: 'User already has this role' },

  // Validation
  EMAIL_EMPTY:           { status: 400, message: 'Email is required' },
  EMAIL_INVALID_FORMAT:  { status: 400, message: 'Invalid email format' },
  PASSWORD_TOO_SHORT:    { status: 400, message: 'Password must be at least 8 characters' },
  PASSWORD_TOO_WEAK:     { status: 400, message: 'Password must contain uppercase, number, and special character' },

  // Tokens
  TOKEN_INVALID:         { status: 401, message: 'Token is invalid' },
  TOKEN_EXPIRED:         { status: 401, message: 'Token has expired' },
  TOKEN_REVOKED:         { status: 401, message: 'Token has been revoked' },
  TOKEN_ALREADY_USED:    { status: 401, message: 'Token has already been used' },
  REFRESH_TOKEN_REUSED:  { status: 401, message: 'Security violation detected. Please log in again' },
};

export function mapAuthError(code: string): ErrorMeta {
  return errorMap[code] ?? { status: 500, message: 'An unexpected error occurred' };
}
```

#### AuthController

```typescript
// infrastructure/http/AuthController.ts

import { Request, Response } from 'express';
import { ApiResponse }       from '@erp/core/http';
import { mapAuthError }      from './AuthErrorMapper';
import type {
  LoginUseCase,
  RegisterUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
} from '../../application/use-cases';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,   // 7 days in ms
};

export class AuthController {
  constructor(
    private readonly loginUseCase:        LoginUseCase,
    private readonly registerUseCase:     RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase:       LogoutUseCase,
  ) {}

  login = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.loginUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapAuthError(result.getError());
      return res.status(status).json(
        ApiResponse.error(result.getError(), message, status)
      );
    }

    const { accessToken, refreshToken } = result.getValue();

    // Refresh token goes into an httpOnly cookie — never in the response body
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(
      ApiResponse.success({ accessToken }, 'Login successful')
    );
  };

  register = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.registerUseCase.execute(req.body);

    if (result.isFailure()) {
      const { status, message } = mapAuthError(result.getError());
      return res.status(status).json(
        ApiResponse.error(result.getError(), message, status)
      );
    }

    return res.status(201).json(
      ApiResponse.success(result.getValue(), 'Registration successful', 201)
    );
  };

  refresh = async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json(
        ApiResponse.error('UNAUTHORIZED', 'Refresh token is missing', 401)
      );
    }

    const result = await this.refreshTokenUseCase.execute({ refreshToken });

    if (result.isFailure()) {
      // On any token failure, clear the cookie to force re-login
      res.clearCookie('refreshToken');
      const { status, message } = mapAuthError(result.getError());
      return res.status(status).json(
        ApiResponse.error(result.getError(), message, status)
      );
    }

    const { accessToken, refreshToken: newRefreshToken } = result.getValue();

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(
      ApiResponse.success({ accessToken }, 'Token refreshed successfully')
    );
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.cookies?.refreshToken;
    const allDevices   = req.body?.allDevices === true;

    if (refreshToken) {
      await this.logoutUseCase.execute({ refreshToken, allDevices });
    }

    res.clearCookie('refreshToken');

    return res.status(200).json(
      ApiResponse.success(null, allDevices ? 'Logged out from all devices' : 'Logged out successfully')
    );
  };

  me = async (req: Request, res: Response): Promise<Response> => {
    // req.user is attached by the authenticate middleware
    return res.status(200).json(
      ApiResponse.success(req.user, 'User retrieved successfully')
    );
  };
}
```

#### Authenticate Middleware

```typescript
// infrastructure/http/middlewares/authenticate.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ApiResponse }                     from '@erp/core/http';
import { ITokenService }                   from '../../../application/ports/ITokenService';

export const createAuthMiddleware = (tokenService: ITokenService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json(
        ApiResponse.error('UNAUTHORIZED', 'Authorization header is missing or malformed', 401)
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await tokenService.verifyAccessToken(token);
      req.user = payload;   // attach decoded payload to request
      next();
    } catch (err: any) {
      const code    = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
      const message = code === 'TOKEN_EXPIRED' ? 'Token has expired' : 'Token is invalid';
      return res.status(401).json(ApiResponse.error(code, message, 401));
    }
  };
};
```

#### RBAC Middleware

```typescript
// infrastructure/http/middlewares/rbac.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ApiResponse }                     from '@erp/core/http';

// Extracts the module name from the URL path: /v1/hr/employees → "hr"
function extractModule(path: string): string {
  const parts = path.split('/').filter(Boolean);
  // parts[0] = "v1", parts[1] = module name
  return parts[1] ?? '';
}

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json(
        ApiResponse.error('UNAUTHORIZED', 'Not authenticated', 401)
      );
    }

    // Coarse-grained: check module access first
    const moduleRequired = extractModule(req.path);
    const hasModuleAccess =
      user.permissions?.includes('*') ||
      user.moduleAccess?.includes(moduleRequired);

    if (!hasModuleAccess) {
      return res.status(403).json(
        ApiResponse.error('MODULE_ACCESS_DENIED', `You do not have access to the ${moduleRequired} module`, 403)
      );
    }

    // Fine-grained: check specific permissions
    const hasAllPermissions =
      user.permissions?.includes('*') ||
      permissions.every(p => user.permissions?.includes(p));

    if (!hasAllPermissions) {
      return res.status(403).json(
        ApiResponse.error('INSUFFICIENT_PERMISSIONS', 'You do not have the required permissions', 403)
      );
    }

    next();
  };
};
```

#### AuthRoutes

```typescript
// infrastructure/http/AuthRoutes.ts

import { Router }              from 'express';
import { AuthController }      from './AuthController';
import { createAuthMiddleware } from './middlewares/authenticate.middleware';
import { ITokenService }       from '../../application/ports/ITokenService';

export function createAuthRoutes(
  controller:   AuthController,
  tokenService: ITokenService,
): Router {
  const router     = Router();
  const authenticate = createAuthMiddleware(tokenService);

  // Public routes — no authentication required
  router.post('/login',          controller.login);
  router.post('/register',       controller.register);
  router.post('/refresh',        controller.refresh);
  router.post('/logout',         controller.logout);

  // Protected routes — authentication required
  router.get('/me',  authenticate, controller.me);

  return router;
}
```

---

## 6. RBAC — Permissions & Roles

### Role Hierarchy

```
SUPER_ADMIN ─── wildcard permission (*) ── all modules, all actions
     │
   ADMIN ──────── full access to assigned modules
     │
  MANAGER ──────── read + write within department scope, can approve
     │
 EMPLOYEE ──────── read access + own data write
     │
   GUEST ─────────── read-only on explicitly granted resources
```

### Permission Format

```
<module>:<resource>:<action>

module   = hr | inventory | finance | ga | auth
resource = employees | departments | products | stock | invoices | assets | ...
action   = read | write | delete | approve | adjust | ...
```

### Full Permission Table

| Permission | SUPER_ADMIN | ADMIN | MANAGER | EMPLOYEE | GUEST |
|---|:---:|:---:|:---:|:---:|:---:|
| `hr:employees:read` | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| `hr:employees:write` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `hr:employees:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `hr:departments:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `hr:departments:write` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `inventory:products:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `inventory:products:write` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `inventory:stock:adjust` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `finance:invoices:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `finance:invoices:write` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance:reports:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `ga:assets:read` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `ga:assets:write` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `ga:procurement-requests:approve` | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 7. Error Handling

### The Chain: Domain → Application → Infrastructure → HTTP

```
Domain (Result.fail)
  └── Use Case returns Result.fail('ERROR_CODE')
        └── Controller calls mapAuthError('ERROR_CODE')
              └── Gets { status: number, message: string }
                    └── Returns ApiResponse.error(code, message, status)
```

No `try/catch` for business logic anywhere. The only `try/catch` blocks are in the infrastructure layer for external failures (JWT verification, database errors) — and those are mapped to domain error codes immediately.

### Complete Error Code Reference

| Error Code | HTTP Status | Meaning |
|---|:---:|---|
| `INVALID_CREDENTIALS` | 401 | Email not found or password mismatch — same error intentionally |
| `USER_INACTIVE` | 403 | Account has been deactivated |
| `USER_NOT_FOUND` | 404 | User ID does not exist |
| `EMAIL_ALREADY_EXISTS` | 409 | Registration attempted with a taken email |
| `USER_ALREADY_INACTIVE` | 409 | Deactivate called on already inactive user |
| `ROLE_UNCHANGED` | 409 | Role change called with the same role |
| `EMAIL_EMPTY` | 400 | Email field is blank |
| `EMAIL_INVALID_FORMAT` | 400 | Email does not match valid format |
| `PASSWORD_TOO_SHORT` | 400 | Password under 8 characters |
| `PASSWORD_TOO_WEAK` | 400 | Missing uppercase, number, or special character |
| `TOKEN_INVALID` | 401 | JWT is malformed, tampered, or tokenId not in DB |
| `TOKEN_EXPIRED` | 401 | JWT TTL has elapsed |
| `TOKEN_REVOKED` | 401 | Token was explicitly revoked |
| `TOKEN_ALREADY_USED` | 401 | Token has already been consumed in a rotation |
| `REFRESH_TOKEN_REUSED` | 401 | Stolen token detected — entire family revoked |

---

## 8. Testing Strategy

### Pyramid

```
        ▲
       / \
      / E2E \         — Full HTTP round-trip (1–2 tests per endpoint)
     /────────\
    /Integration\     — Controller → Use Case → Mock DB (1 per happy path)
   /──────────────\
  /   Unit Tests   \  — Domain + Use Cases with mocks (majority of tests)
 /──────────────────\
```

### Mock Objects Pattern

All test doubles implement the same interfaces as their real counterparts. They live in `@erp/shared/testing`.

```typescript
// libs/shared/testing/src/mocks/MockUserRepository.ts

export class MockUserRepository implements IUserRepository {
  private user:  User | null = null;
  private saved: User | null = null;
  private savedHash: string | null = null;

  setUser(user: User | null) { this.user = user; }
  getSaved() { return { user: this.saved, hash: this.savedHash }; }

  async findById(_id: string)           { return this.user; }
  async findByEmail(_email: string)     { return this.user; }
  async save(user: User, hash: string)  { this.saved = user; this.savedHash = hash; }
  async update(user: User)              { this.saved = user; }
}
```

```typescript
// libs/shared/testing/src/mocks/MockEventBus.ts

export class MockEventBus implements IEventBus {
  public published: DomainEvent[] = [];

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    this.published.push(event);
  }

  subscribe() {}
  unsubscribe() {}
}
```

```typescript
// libs/shared/testing/src/builders/UserBuilder.ts
// Builder pattern for constructing test fixtures consistently

export class UserBuilder {
  private props = {
    email:    'user@test.com',
    password: 'MyP@ssw0rd!',
    role:     'EMPLOYEE' as UserRole,
  };

  withEmail(email: string)    { this.props.email    = email;    return this; }
  withPassword(pw: string)    { this.props.password = pw;       return this; }
  withRole(role: UserRole)    { this.props.role     = role;     return this; }
  inactive()                  { return this; }   // deactivate after build

  build(): User {
    return User.create(this.props).getValue();
  }

  async buildWithHashedPassword(): Promise<{ user: User; hash: string }> {
    const user = this.build();
    const hash = await user.password.hash();
    return { user, hash };
  }
}
```

### Test Coverage Expectations

| Layer | Target Coverage | Focus |
|---|:---:|---|
| Domain (value objects, entities) | 100% | All valid + invalid states, all behaviour branches |
| Use Cases | 100% | All success paths + all named failure paths |
| Infrastructure (repositories) | 70% | Happy path + critical error cases |
| HTTP (controllers, routes) | 70% | Status codes, cookie handling, response shape |

---

## 9. Module Bootstrap

```typescript
// AuthModule.ts

import { IModule, ModuleRegistry }     from '@erp/core/module-registry';
import { IEventBus }                   from '@erp/core/event-bus';
import { Router }                      from 'express';
import { Pool }                        from 'pg';

import { PostgresUserRepository }          from './infrastructure/repositories/PostgresUserRepository';
import { PostgresRefreshTokenRepository }  from './infrastructure/repositories/PostgresRefreshTokenRepository';
import { JwtTokenService }                 from './infrastructure/services/JwtTokenService';
import { PermissionResolver }              from './infrastructure/services/PermissionResolver';
import { AuthController }                  from './infrastructure/http/AuthController';
import { createAuthRoutes }                from './infrastructure/http/AuthRoutes';
import { LoginUseCase }                    from './application/use-cases/LoginUseCase';
import { RegisterUseCase }                 from './application/use-cases/RegisterUseCase';
import { RefreshTokenUseCase }             from './application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase }                   from './application/use-cases/LogoutUseCase';

export interface AuthModuleConfig {
  db:                   Pool;
  eventBus:             IEventBus;
  jwtAccessSecret:      string;
  jwtRefreshSecret:     string;
}

export class AuthModule implements IModule {
  name         = 'auth';
  version      = '1.0.0';
  dependencies = [];           // auth has no module dependencies

  private router!: Router;

  constructor(private readonly config: AuthModuleConfig) {}

  async register(): Promise<void> {}

  async bootstrap(): Promise<void> {
    const { db, eventBus, jwtAccessSecret, jwtRefreshSecret } = this.config;

    // ── Repositories ─────────────────────────────────────────
    const userRepo  = new PostgresUserRepository(db);
    const tokenRepo = new PostgresRefreshTokenRepository(db);

    // ── Services ─────────────────────────────────────────────
    const tokenService  = new JwtTokenService({
      accessTokenSecret:  jwtAccessSecret,
      refreshTokenSecret: jwtRefreshSecret,
      accessTokenTtl:     '15m',
      refreshTokenTtl:    '7d',
    });
    const permResolver  = new PermissionResolver();

    // ── Use Cases ────────────────────────────────────────────
    const loginUseCase   = new LoginUseCase(userRepo, tokenRepo, tokenService, permResolver, eventBus);
    const registerUseCase = new RegisterUseCase(userRepo, eventBus);
    const refreshUseCase = new RefreshTokenUseCase(tokenRepo, userRepo, tokenService, permResolver, eventBus);
    const logoutUseCase  = new LogoutUseCase(tokenRepo, tokenService);

    // ── HTTP ─────────────────────────────────────────────────
    const controller = new AuthController(loginUseCase, registerUseCase, refreshUseCase, logoutUseCase);
    this.router      = createAuthRoutes(controller, tokenService);
  }

  getRoutes(): Router {
    return this.router;
  }

  getEventHandlers() {
    // Auth subscribes to HR events to auto-create user accounts
    return {
      'hr.employee.created': this.onEmployeeCreated.bind(this),
    };
  }

  private async onEmployeeCreated(event: any): Promise<void> {
    // When HR creates an employee, Auth auto-creates their login account
    // Implementation handled by an internal use case
  }

  async teardown(): Promise<void> {
    // Clean up connections if needed
  }
}
```

---

## 10. Data Flow Diagrams

### Login Flow

```
POST /v1/auth/login
{ email, password }
        │
        ▼
  AuthController.login()
        │
        ▼
  LoginUseCase.execute()
        │
        ├── findByEmail() ──────────── PostgresUserRepository
        │       │
        │   not found? ──────────────▶ Result.fail('INVALID_CREDENTIALS')
        │       │
        ├── user.isActive? ──────────▶ Result.fail('USER_INACTIVE')
        │
        ├── password.compare() ──────▶ Result.fail('INVALID_CREDENTIALS')
        │
        ├── RefreshToken.create()
        ├── tokenRepo.save()
        │
        ├── generatePair() ─────────── JwtTokenService
        │
        ├── eventBus.publish(UserLoggedIn)
        │
        └── Result.ok({ accessToken, refreshToken })
                │
                ▼
        Controller sets cookie(refreshToken)
        Returns body: { accessToken }
```

### Refresh Token Flow — Normal Rotation

```
POST /v1/auth/refresh
cookie: refreshToken
        │
        ▼
  AuthController.refresh()
        │
        ▼
  RefreshTokenUseCase.execute()
        │
        ├── verifyRefreshToken() ─────── JwtTokenService (verify JWT sig)
        │       │
        │   invalid? ────────────────▶ Result.fail('TOKEN_INVALID')
        │
        ├── tokenRepo.findById()
        │       │
        │   not found? ──────────────▶ Result.fail('TOKEN_INVALID')
        │
        ├── token.isReuse()? ──────────▶ revokeAllInFamily()
        │                                publish(TokenFamilyCompromised)
        │                                Result.fail('REFRESH_TOKEN_REUSED')
        │
        ├── token.use()
        │       │
        │   expired/revoked? ─────────▶ Result.fail('TOKEN_EXPIRED / TOKEN_REVOKED')
        │
        ├── tokenRepo.save(token used)
        ├── RefreshToken.createChild()
        ├── tokenRepo.save(childToken)
        │
        ├── userRepo.findById() ── verify user still active
        ├── generatePair(childToken.id)
        │
        └── Result.ok({ accessToken, refreshToken })
                │
                ▼
        Controller sets cookie(new refreshToken)
        Returns body: { new accessToken }
```

### Stolen Token Detection Flow

```
Attacker presents an already-used refresh token
        │
        ▼
  token.isReuse() ── true
        │
        ├── tokenRepo.revokeAllInFamily(familyId)
        │         All tokens in this session invalidated
        │
        ├── eventBus.publish(TokenFamilyCompromised)
        │         Other modules can react (e.g. send security alert email)
        │
        └── Result.fail('REFRESH_TOKEN_REUSED')
                │
                ▼
        res.clearCookie('refreshToken')
        401 { code: 'REFRESH_TOKEN_REUSED',
              message: 'Security violation detected. Please log in again' }

        ← Both attacker AND legitimate user are now logged out
        ← Next valid access token request from legitimate user returns 401
        ← Both must re-authenticate with email + password
```