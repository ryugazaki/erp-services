# ERP Services — Pluggable Modular Architecture

A scalable, maintainable ERP system built using a **Pluggable Module System**, **Clean Architecture**, and **Event-Driven Communication**.

---

## Overview

This system is designed with one core principle:

> **Each module must be independent (standalone) while still able to communicate without tight coupling.**

The architecture enables:
- Independent module development
- Safe extensibility
- High testability (TDD-first)
- Clear separation of concerns

---

## Project Structure

```bash
erp-services/
├── core/                          # System core (DO NOT modify carelessly)
│   ├── gateway/                   # API Gateway (entry point for all requests)
│   ├── event-bus/                 # Internal message broker (EventEmitter / RabbitMQ)
│   ├── module-registry/           # Module registration & discovery system
│   ├── shared-kernel/             # Shared types, interfaces, base classes
│   └── config/                    # Global configuration
│
├── modules/                       # Business modules
│   ├── auth/
│   ├── inventory/
│   ├── hr/
│   ├── ga/
│   └── finance/
│
├── infrastructure/                # Technical infrastructure
│   ├── database/                  # DB connections, migrations
│   ├── cache/                     # Redis
│   ├── storage/                   # File storage
│   └── logger/
│
└── docker-compose.yml
```

---

## Module System — Core Concept

### Module Contract

Every module **must implement** the `IModule` interface:

```ts
export interface IModule {
  name: string;
  version: string;
  dependencies: string[];

  register(container: DIContainer): Promise<void>;
  bootstrap(): Promise<void>;
  teardown(): Promise<void>;
  getRoutes(): Router;
  getEventHandlers(): EventHandlerMap;
}
```

### Module Registry

Responsible for:
- Validating dependencies
- Registering modules
- Bootstrapping lifecycle
- Graceful shutdown

```ts
export class ModuleRegistry {
  private modules = new Map<string, IModule>();

  async register(module: IModule): Promise<void> {
    this.validateDependencies(module);
    this.modules.set(module.name, module);
    await module.bootstrap();

    Logger.info(`Module [${module.name}] registered`);
  }

  async unregister(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    await module?.teardown();
    this.modules.delete(moduleName);

    Logger.info(`Module [${moduleName}] removed`);
  }
}
```

---

## Module Architecture (Clean Architecture)

Each module strictly follows:

> **Domain → Application → Infrastructure**

### Example: `auth` module

```bash
modules/auth/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   └── events/
│
├── application/
│   ├── use-cases/
│   ├── dtos/
│   └── ports/
│
├── infrastructure/
│   ├── repositories/
│   ├── services/
│   └── http/
│
├── tests/
│   ├── unit/
│   └── integration/
│
└── AuthModule.ts
```

### Layer Responsibilities

| Layer | Responsibility |
|------|--------------|
| **Domain** | Pure business logic (no dependencies) |
| **Application** | Use cases and orchestration |
| **Infrastructure** | External systems (DB, HTTP, services) |

---

## Test-Driven Development (TDD)

TDD is **mandatory**.

### Workflow

```
RED → GREEN → REFACTOR
```

### Rules

- Write tests **before implementation**
- Cover all use cases
- No feature without tests

---

## Inter-Module Communication

### ❌ Forbidden
- Direct imports between modules

### ✅ Required
- Communication via **Event Bus**

### Example Flow

#### Publish Event (HR Module)

```ts
await this.eventBus.publish(new EmployeeCreated({
  employeeId: employee.id,
  email: employee.email,
  department: employee.department,
}));
```

#### Consume Event (Auth Module)

```ts
export class OnEmployeeCreated implements IEventHandler<EmployeeCreated> {
  async handle(event: EmployeeCreated): Promise<void> {
    await this.createUserUseCase.execute({
      email: event.email,
      role: 'EMPLOYEE',
      tempPassword: generateTempPassword(),
    });
  }
}
```

---

## Shared Kernel

The **only allowed shared layer between modules**:

```ts
export * from './types/Result';
export * from './types/Pagination';
export * from './events/DomainEvent';
export * from './interfaces/IEventBus';
export * from './interfaces/IUseCase';
export * from './errors/AppError';
export * from './decorators/Inject';
```

---

## Database Strategy

Each module owns its own schema:

```sql
CREATE SCHEMA auth;
CREATE SCHEMA inventory;
CREATE SCHEMA hr;
CREATE SCHEMA ga;
CREATE SCHEMA finance;
```

### Rules

- ❌ No cross-schema foreign keys  
- ✅ Use IDs for references  
- ✅ Resolve relationships via API or events  

---

## Non-Negotiable Principles

- Modules must **not import other modules**
- TDD is **mandatory**
- No `any` in TypeScript
- Use `Result<T>` for error handling (no try-catch in business logic)
- All events must be documented in an **Event Catalog**

---

## Design Philosophy

> **Build like LEGO**

- Each module = one independent brick  
- Standardized interfaces  
- Plug & play architecture  
- Safe to add/remove modules  

---

## Adding a New Module

1. Implement `IModule`
2. Follow Clean Architecture structure
3. Register the module in `ModuleRegistry`
4. Add tests (TDD-first)
5. Publish/subscribe to events if needed

---

## Tech Stack (Suggested)

- Node.js / TypeScript
- PostgreSQL
- Redis
- RabbitMQ / EventEmitter
- Docker

---

## License

MIT (or your preferred license)

---

## Contributing

1. Follow architecture guidelines
2. Write tests first (TDD)
3. Do not break module boundaries
4. Document new events in Event Catalog