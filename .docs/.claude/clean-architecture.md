# Nx Monorepo Structure — ERP Modular System

## Overview

The ERP system uses Nx monorepo as its workspace foundation. The core principle is that every module must be able to stand alone while still being able to communicate with other modules — without tight coupling.

There are three primary concepts to understand:

- **apps** — executable processes with a `main.ts` entry point, the final running artifact
- **libs** — non-executable, importable only; this is where all business logic lives
- **modules** — domain-specific units that own their own logic but are consumed by apps

---

## Full Directory Structure

```
erp-system/                          ← root workspace
│
├── apps/
│   ├── gateway/                     ← API Gateway, single HTTP entry point
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.ts
│   │   │   └── bootstrap.ts         ← loads & registers all modules
│   │   ├── project.json
│   │   └── tsconfig.app.json
│   │
│   └── gateway-e2e/                 ← end-to-end tests for gateway
│
├── libs/
│   │
│   ├── shared/
│   │   ├── kernel/                  ← @erp/shared/kernel
│   │   │   └── src/
│   │   │       ├── types/
│   │   │       │   ├── Result.ts
│   │   │       │   ├── Either.ts
│   │   │       │   └── Pagination.ts
│   │   │       ├── errors/
│   │   │       │   ├── AppError.ts
│   │   │       │   └── DomainError.ts
│   │   │       ├── events/
│   │   │       │   └── DomainEvent.ts
│   │   │       └── interfaces/
│   │   │           ├── IUseCase.ts
│   │   │           ├── IRepository.ts
│   │   │           └── IMapper.ts
│   │   │
│   │   ├── utils/                   ← @erp/shared/utils
│   │   │   └── src/
│   │   │       ├── date.utils.ts
│   │   │       ├── string.utils.ts
│   │   │       └── crypto.utils.ts
│   │   │
│   │   └── testing/                 ← @erp/shared/testing
│   │       └── src/
│   │           ├── builders/        ← test data builders
│   │           └── mocks/           ← shared mock factories
│   │
│   └── core/
│       ├── module-registry/         ← @erp/core/module-registry
│       │   └── src/
│       │       ├── IModule.ts
│       │       └── ModuleRegistry.ts
│       │
│       ├── event-bus/               ← @erp/core/event-bus
│       │   └── src/
│       │       ├── IEventBus.ts
│       │       ├── InMemoryEventBus.ts    ← dev / test
│       │       └── RabbitMQEventBus.ts    ← production
│       │
│       ├── database/                ← @erp/core/database
│       │   └── src/
│       │       ├── DatabaseConnection.ts
│       │       └── BaseRepository.ts
│       │
│       └── http/                    ← @erp/core/http
│           └── src/
│               ├── BaseController.ts
│               └── middlewares/
│                   ├── auth.middleware.ts
│                   ├── error.middleware.ts
│                   └── validate.middleware.ts
│
├── modules/
│   ├── auth/                        ← @erp/module/auth
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   ├── repositories/
│   │   │   │   └── events/
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   ├── dtos/
│   │   │   │   └── ports/
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   ├── services/
│   │   │   │   └── http/
│   │   │   ├── tests/
│   │   │   │   ├── unit/
│   │   │   │   └── integration/
│   │   │   └── AuthModule.ts        ← implements IModule
│   │   └── project.json
│   │
│   ├── inventory/                   ← @erp/module/inventory
│   ├── hr/                          ← @erp/module/hr
│   ├── ga/                          ← @erp/module/ga
│   └── finance/                     ← @erp/module/finance
│
├── tools/
│   ├── generators/
│   │   └── module/                  ← custom generator: nx g @erp/tools:module
│   │       ├── index.ts
│   │       └── files/               ← template files
│   └── scripts/
│       ├── seed.ts
│       └── migrate.ts
│
├── nx.json                          ← Nx configuration
├── tsconfig.base.json               ← path aliases for all projects
└── package.json                     ← single node_modules for all
```

---

## Key Configuration Files

### `tsconfig.base.json` — Path Aliases

Enables clean, unambiguous imports across the entire workspace.

```json
{
  "compilerOptions": {
    "paths": {
      "@erp/shared/kernel":        ["libs/shared/kernel/src/index.ts"],
      "@erp/shared/utils":         ["libs/shared/utils/src/index.ts"],
      "@erp/shared/testing":       ["libs/shared/testing/src/index.ts"],
      "@erp/core/module-registry": ["libs/core/module-registry/src/index.ts"],
      "@erp/core/event-bus":       ["libs/core/event-bus/src/index.ts"],
      "@erp/core/database":        ["libs/core/database/src/index.ts"],
      "@erp/core/http":            ["libs/core/http/src/index.ts"],
      "@erp/module/auth":          ["modules/auth/src/index.ts"],
      "@erp/module/inventory":     ["modules/inventory/src/index.ts"],
      "@erp/module/hr":            ["modules/hr/src/index.ts"],
      "@erp/module/ga":            ["modules/ga/src/index.ts"],
      "@erp/module/finance":       ["modules/finance/src/index.ts"]
    }
  }
}
```

Result — clean imports instead of fragile relative paths:

```typescript
// ✅ clean and explicit
import { Result }  from '@erp/shared/kernel';
import { IModule } from '@erp/core/module-registry';
import { IEventBus } from '@erp/core/event-bus';

// ❌ what we avoid
import { Result } from '../../../../../../../libs/shared/kernel/src/types/Result';
```

---

### `nx.json` — Caching & Task Pipeline

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
    }
  }
}
```

---

### `project.json` — Tags per Project

Tags are the mechanism that drives boundary enforcement. Every project must declare its scope and type.

```json
// libs/shared/kernel/project.json
{
  "name": "shared-kernel",
  "tags": ["scope:shared", "type:util"]
}

// libs/core/event-bus/project.json
{
  "name": "core-event-bus",
  "tags": ["scope:core", "type:infrastructure"]
}

// modules/auth/project.json
{
  "name": "module-auth",
  "tags": ["scope:module", "domain:auth", "type:module"]
}

// apps/gateway/project.json
{
  "name": "gateway",
  "tags": ["scope:app"]
}
```

---

### `.eslintrc.json` — Enforced Boundary Rules

This is the architectural guardrail. Violations are caught at lint time, not at runtime.

```json
{
  "rules": {
    "@nx/enforce-module-boundaries": ["error", {
      "enforceBuildableLibDependency": true,
      "depConstraints": [
        {
          "sourceTag": "scope:shared",
          "onlyDependOnLibsWithTags": ["scope:shared"]
        },
        {
          "sourceTag": "scope:core",
          "onlyDependOnLibsWithTags": ["scope:shared", "scope:core"]
        },
        {
          "sourceTag": "scope:module",
          "onlyDependOnLibsWithTags": ["scope:shared", "scope:core"]
        },
        {
          "sourceTag": "scope:app",
          "onlyDependOnLibsWithTags": ["scope:shared", "scope:core", "scope:module"]
        }
      ]
    }]
  }
}
```

When violated, the developer sees an immediate ESLint error:

```
// modules/finance/src/application/use-cases/PayrollUseCase.ts

import { EmployeeService } from '@erp/module/hr'; // ← ESLint error

// A project tagged with 'scope:module' can only depend on
// libs tagged with 'scope:shared' or 'scope:core'
// @nx/enforce-module-boundaries
```

---

## Dependency Graph

Dependencies flow strictly downward. No horizontal imports between modules. No upward imports from lower layers.

```
                    ┌─────────────────┐
                    │   apps/gateway  │  scope:app
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
    │ module/auth │  │  module/hr  │  │module/finance│  scope:module
    └──────┬──────┘  └──────┬──────┘  └──────┬───────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
       ┌────────────┐ ┌──────────┐ ┌──────────┐
       │ core/      │ │ core/    │ │ core/    │  scope:core
       │ event-bus  │ │ http     │ │ database │
       └─────┬──────┘ └────┬─────┘ └────┬────┘
             │             │            │
             └─────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌────────────┐ ┌─────────┐ ┌──────────┐
       │ shared/    │ │ shared/ │ │ shared/  │  scope:shared
       │ kernel     │ │ utils   │ │ testing  │
       └────────────┘ └─────────┘ └──────────┘

  Rule: dependencies flow downward only.
  Horizontal (module → module) is forbidden.
  Upward (shared → core) is forbidden.
```

---

## `index.ts` as Public API Contract

Every lib and module must have an `index.ts` that explicitly controls what is accessible from outside. This is non-negotiable.

```typescript
// modules/auth/src/index.ts

// ✅ Exported: module entry point and publishable events
export { AuthModule }         from './AuthModule';
export type { AuthModuleConfig } from './AuthModule';
export { UserCreated }        from './domain/events/UserCreated';
export { UserLoggedIn }       from './domain/events/UserLoggedIn';

// ❌ NOT exported: UseCases, Repositories, Entities, internal services
// These are auth module's internal concern only.
```

Even if the files physically exist in the repository, other modules cannot access auth internals because the Nx path alias points exclusively to `index.ts`.

---

## Custom Module Generator

To keep module structure consistent and onboarding fast, a custom Nx generator scaffolds every new module automatically.

```bash
# One command — full structure generated
$ nx generate @erp/tools:module purchasing
```

This automatically produces:

```
modules/purchasing/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/
│   │   └── events/
│   ├── application/
│   │   ├── use-cases/
│   │   ├── dtos/
│   │   └── ports/
│   ├── infrastructure/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── http/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── PurchasingModule.ts   ← already implements IModule
└── project.json              ← already tagged correctly
```

It also auto-updates `tsconfig.base.json` with the new path alias and registers the module in the gateway bootstrap file.

---

## Affected — Only Build and Test What Changed

One of Nx's most impactful features. Nx reads the dependency graph and determines precisely which projects are affected by a given change.

```bash
# Only the finance module was modified

$ nx affected:test

# Nx runs:
# ✅ module-finance  — directly changed
# ✅ gateway         — depends on finance
# ⏭️  module-auth     — SKIP, unaffected
# ⏭️  module-hr       — SKIP, unaffected
# ⏭️  module-inventory — SKIP, unaffected
```

In a multi-repo setup, the developer must manually determine what needs re-testing. In Nx, the dependency graph handles it.

---

## Everyday Commands

```bash
# Development
nx serve gateway                         # Run the gateway
nx test module-auth                      # Test a single module
nx test module-auth --watch              # Watch mode
nx test module-auth --coverage           # With coverage report

# Affected (use in CI and during development)
nx affected:test                         # Test only affected projects
nx affected:build                        # Build only affected projects
nx affected:lint                         # Lint only affected projects

# Visualization
nx graph                                 # Open dependency graph in browser

# Code generation
nx generate @erp/tools:module <name>     # Scaffold a new domain module
nx generate @nx/node:lib <name>          # Scaffold a new shared lib

# Maintenance
nx reset                                 # Clear Nx cache
```

---

## Layer Summary

| Layer | Location | Tag | May depend on |
|---|---|---|---|
| Executable | `apps/` | `scope:app` | All layers |
| Domain Module | `modules/` | `scope:module` | core, shared |
| Infrastructure Core | `libs/core/` | `scope:core` | shared only |
| Pure Utilities | `libs/shared/` | `scope:shared` | shared only |

The structure is not merely a folder convention. Each layer carries a contract enforced by tooling at lint time — architectural rules become compiler errors, not documentation that gets ignored.