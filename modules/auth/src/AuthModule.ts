import 'reflect-metadata';
import { Router } from 'express';
import { Kysely } from 'kysely';
import { container, injectable } from 'tsyringe';
import { IModule, EventHandlerMap } from '@erp/core/module-registry';
import { IEventBus } from '@erp/core/event-bus';
import { TOKENS } from './application/tokens';
import { IUserRepository } from './domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from './domain/repositories/IRefreshTokenRepository';
import { ITokenService } from './application/ports/ITokenService';
import { IPermissionResolver } from './application/ports/IPermissionResolver';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { RegisterUseCase } from './application/use-cases/RegisterUseCase';
import { RefreshTokenUseCase } from './application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from './application/use-cases/LogoutUseCase';
import { DeactivateUserUseCase } from './application/use-cases/DeactivateUserUseCase';
import { KyselyUserRepository } from './infrastructure/repositories/KyselyUserRepository';
import { KyselyRefreshTokenRepository } from './infrastructure/repositories/KyselyRefreshTokenRepository';
import { JwtTokenService } from './infrastructure/services/JwtTokenService';
import { PermissionResolver } from './infrastructure/services/PermissionResolver';
import { AuthController } from './infrastructure/http/AuthController';
import { createAuthRoutes } from './infrastructure/http/AuthRoutes';

export interface AuthModuleConfig {
  db: Kysely<any>;
  eventBus: IEventBus;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
}

@injectable()
export class AuthModule implements IModule {
  name = 'auth';
  version = '1.0.0';
  dependencies: string[] = [];

  private router!: Router;
  private config: AuthModuleConfig;

  constructor(config: AuthModuleConfig) {
    this.config = config;
  }

  async register(_container: any): Promise<void> {
    container.registerInstance(TOKENS.UserRepository, new KyselyUserRepository(this.config.db));
    container.registerInstance(TOKENS.RefreshTokenRepository, new KyselyRefreshTokenRepository(this.config.db));
    container.registerInstance(TOKENS.TokenService, new JwtTokenService({
      accessTokenSecret: this.config.jwtAccessSecret,
      refreshTokenSecret: this.config.jwtRefreshSecret,
      accessTokenTtl: '15m',
      refreshTokenTtl: '7d',
    }));
    container.registerInstance(TOKENS.PermissionResolver, new PermissionResolver());
    container.registerInstance(TOKENS.EventBus, this.config.eventBus);
  }

  async bootstrap(): Promise<void> {
    const userRepo = container.resolve<IUserRepository>(TOKENS.UserRepository);
    const tokenRepo = container.resolve<IRefreshTokenRepository>(TOKENS.RefreshTokenRepository);
    const tokenService = container.resolve<ITokenService>(TOKENS.TokenService);
    const permResolver = container.resolve<IPermissionResolver>(TOKENS.PermissionResolver);
    const eventBus = container.resolve<IEventBus>(TOKENS.EventBus);

    const loginUseCase = new LoginUseCase(userRepo, tokenRepo, tokenService, permResolver, eventBus);
    const registerUseCase = new RegisterUseCase(userRepo, eventBus);
    const refreshUseCase = new RefreshTokenUseCase(tokenRepo, userRepo, tokenService, permResolver, eventBus);
    const logoutUseCase = new LogoutUseCase(tokenRepo, tokenService);

    const controller = new AuthController(loginUseCase, registerUseCase, refreshUseCase, logoutUseCase);
    this.router = createAuthRoutes(controller, tokenService);
  }

  getRoutes(): Router {
    return this.router;
  }

  getEventHandlers(): EventHandlerMap {
    return {};
  }

  async teardown(): Promise<void> {}
}
