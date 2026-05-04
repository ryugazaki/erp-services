import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITokenService, TokenPair } from '../ports/ITokenService';
import { IPermissionResolver } from '../ports/IPermissionResolver';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { TokenFamilyCompromised } from '../../domain/events/TokenFamilyCompromised';
import { RefreshTokenDTO } from '../dtos/RefreshTokenDTO';
import { TOKENS } from '../tokens';

@injectable()
export class RefreshTokenUseCase implements IUseCase<RefreshTokenDTO, Result<TokenPair>> {
  constructor(
    @inject(TOKENS.RefreshTokenRepository) private readonly tokenRepo: IRefreshTokenRepository,
    @inject(TOKENS.UserRepository) private readonly userRepo: IUserRepository,
    @inject(TOKENS.TokenService) private readonly tokenService: ITokenService,
    @inject(TOKENS.PermissionResolver) private readonly permResolver: IPermissionResolver,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<Result<TokenPair>> {
    let tokenId: string;
    let userId: string;

    try {
      const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
      tokenId = payload.tokenId;
      userId = payload.userId;
    } catch {
      return Result.fail('TOKEN_INVALID');
    }

    const token = await this.tokenRepo.findById(tokenId);
    if (!token) return Result.fail('TOKEN_INVALID');

    if (token.isReuse()) {
      await this.tokenRepo.revokeAllInFamily(token.familyId);

      await this.eventBus.publish(new TokenFamilyCompromised(
        token.familyId,
        userId,
        'REFRESH_TOKEN_REUSE_DETECTED',
      ));

      return Result.fail('REFRESH_TOKEN_REUSED');
    }

    const useResult = token.use();
    if (useResult.isFailure()) return Result.fail(useResult.getError());

    await this.tokenRepo.save(token);

    const childToken = RefreshToken.createChild(token);
    await this.tokenRepo.save(childToken);

    const user = await this.userRepo.findById(userId);
    if (!user) return Result.fail('USER_NOT_FOUND');
    if (!user.isActive) return Result.fail('USER_INACTIVE');

    const permissions = this.permResolver.getPermissions(user.role);
    const moduleAccess = this.permResolver.getModuleAccess(user.role);

    const tokenPair = await this.tokenService.generatePair(
      userId,
      { email: user.email.value, role: user.role, permissions, moduleAccess },
      childToken.id,
    );

    return Result.ok(tokenPair);
  }
}
