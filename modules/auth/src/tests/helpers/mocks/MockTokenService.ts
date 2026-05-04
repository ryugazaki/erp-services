import { ITokenService, TokenPair, AccessTokenPayload, RefreshTokenPayload } from '../../../application/ports/ITokenService';

export class MockTokenService implements ITokenService {
  public lastGeneratedTokenId: string | null = null;

  async generatePair(userId: string, payload: Omit<AccessTokenPayload, 'sub'>, tokenId: string): Promise<TokenPair> {
    this.lastGeneratedTokenId = tokenId;
    return {
      accessToken: `access-${userId}-${Date.now()}`,
      refreshToken: `refresh-${tokenId}-${Date.now()}`,
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return {
      sub: 'mock-user-id',
      email: 'mock@test.com',
      role: 'EMPLOYEE',
      permissions: [],
      moduleAccess: [],
    };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    // Extract tokenId from mock format: refresh-{tokenId}-{timestamp}
    const parts = token.split('-');
    return {
      tokenId: parts[1] || 'mock-token-id',
      userId: 'mock-user-id',
    };
  }
}
