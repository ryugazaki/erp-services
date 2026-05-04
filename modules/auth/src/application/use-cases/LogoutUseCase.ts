import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { ITokenService } from '../ports/ITokenService';
import { LogoutDTO } from '../dtos/LogoutDTO';
import { TOKENS } from '../tokens';

@injectable()
export class LogoutUseCase implements IUseCase<LogoutDTO & { refreshToken?: string }, Result<void>> {
  constructor(
    @inject(TOKENS.RefreshTokenRepository) private readonly tokenRepo: IRefreshTokenRepository,
    @inject(TOKENS.TokenService) private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: LogoutDTO & { refreshToken?: string }): Promise<Result<void>> {
    try {
      if (!dto.refreshToken) return Result.ok(undefined);

      const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);

      if (dto.allDevices) {
        await this.tokenRepo.revokeAllByUserId(payload.userId);
      } else {
        const token = await this.tokenRepo.findById(payload.tokenId);
        if (token) {
          await this.tokenRepo.revokeAllInFamily(token.familyId);
        }
      }
    } catch {
      // Even if token is invalid, logout is still success
    }

    return Result.ok(undefined);
  }
}
