import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { ITokenService, TokenPair, AccessTokenPayload, RefreshTokenPayload } from '../../application/ports/ITokenService';

interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
}

@injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly config: JwtConfig) {}

  async generatePair(
    userId: string,
    payload: Omit<AccessTokenPayload, 'sub'>,
    tokenId: string,
  ): Promise<TokenPair> {
    const accessToken = jwt.sign(
      { sub: userId, ...payload },
      this.config.accessTokenSecret,
      { expiresIn: this.config.accessTokenTtl as any },
    );

    const refreshToken = jwt.sign(
      { tokenId, userId },
      this.config.refreshTokenSecret,
      { expiresIn: this.config.refreshTokenTtl as any },
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
