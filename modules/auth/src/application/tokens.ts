export const TOKENS = {
  UserRepository: Symbol('IUserRepository'),
  RefreshTokenRepository: Symbol('IRefreshTokenRepository'),
  TokenService: Symbol('ITokenService'),
  PermissionResolver: Symbol('IPermissionResolver'),
  EventBus: Symbol('IEventBus'),
} as const;
