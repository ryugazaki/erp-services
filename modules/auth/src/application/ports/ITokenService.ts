export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  moduleAccess: string[];
}

export interface RefreshTokenPayload {
  tokenId: string;
  userId: string;
}

export interface ITokenService {
  generatePair(
    userId: string,
    payload: Omit<AccessTokenPayload, 'sub'>,
    tokenId: string,
  ): Promise<TokenPair>;

  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
