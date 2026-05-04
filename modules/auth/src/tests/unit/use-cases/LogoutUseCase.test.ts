import { LogoutUseCase } from '../../../application/use-cases/LogoutUseCase';
import { MockRefreshTokenRepository } from '../../helpers/mocks/MockRefreshTokenRepository';
import { MockTokenService } from '../../helpers/mocks/MockTokenService';

describe('LogoutUseCase', () => {
  let tokenRepo: MockRefreshTokenRepository;
  let tokenService: MockTokenService;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    tokenRepo = new MockRefreshTokenRepository();
    tokenService = new MockTokenService();
    useCase = new LogoutUseCase(tokenRepo as any, tokenService as any);
  });

  it('should return success even without refreshToken', async () => {
    const result = await useCase.execute({ refreshToken: undefined, allDevices: false });
    expect(result.isSuccess()).toBe(true);
  });

  it('should return success with invalid token (graceful)', async () => {
    const result = await useCase.execute({ refreshToken: 'invalid-token', allDevices: false });
    expect(result.isSuccess()).toBe(true);
  });
});
