import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { ITokenService, TokenPair } from '../ports/ITokenService';
import { IPermissionResolver } from '../ports/IPermissionResolver';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { UserLoggedIn } from '../../domain/events/UserLoggedIn';
import { LoginDTO } from '../dtos/LoginDTO';
import { TOKENS } from '../tokens';

@injectable()
export class LoginUseCase implements IUseCase<LoginDTO, Result<TokenPair>> {
  constructor(
    @inject(TOKENS.UserRepository) private readonly userRepo: IUserRepository,
    @inject(TOKENS.RefreshTokenRepository) private readonly tokenRepo: IRefreshTokenRepository,
    @inject(TOKENS.TokenService) private readonly tokenService: ITokenService,
    @inject(TOKENS.PermissionResolver) private readonly permResolver: IPermissionResolver,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: LoginDTO): Promise<Result<TokenPair>> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) return Result.fail('INVALID_CREDENTIALS');

    if (!user.isActive) return Result.fail('USER_INACTIVE');

    const isMatch = await user.password.compare(dto.password);
    if (!isMatch) return Result.fail('INVALID_CREDENTIALS');

    const refreshToken = RefreshToken.create(user.id);
    await this.tokenRepo.save(refreshToken);

    const permissions = this.permResolver.getPermissions(user.role);
    const moduleAccess = this.permResolver.getModuleAccess(user.role);

    const tokens = await this.tokenService.generatePair(
      user.id,
      { email: user.email.value, role: user.role, permissions, moduleAccess },
      refreshToken.id,
    );

    await this.eventBus.publish(new UserLoggedIn(user.id, user.email.value));

    return Result.ok(tokens);
  }
}
