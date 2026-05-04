import { LoginUseCase } from '../../../application/use-cases/LoginUseCase';
import { MockUserRepository } from '../../helpers/mocks/MockUserRepository';
import { MockRefreshTokenRepository } from '../../helpers/mocks/MockRefreshTokenRepository';
import { MockTokenService } from '../../helpers/mocks/MockTokenService';
import { MockEventBus } from '../../helpers/mocks/MockEventBus';
import { UserBuilder } from '../../helpers/builders/UserBuilder';
import { PermissionResolver } from '../../../infrastructure/services/PermissionResolver';
import { User } from '../../../domain/entities/User';

// We need to manually construct since tsyringe decorators need reflect-metadata
// For unit tests, we instantiate directly
describe('LoginUseCase', () => {
  let userRepo: MockUserRepository;
  let tokenRepo: MockRefreshTokenRepository;
  let tokenService: MockTokenService;
  let permResolver: PermissionResolver;
  let eventBus: MockEventBus;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    userRepo = new MockUserRepository();
    tokenRepo = new MockRefreshTokenRepository();
    tokenService = new MockTokenService();
    permResolver = new PermissionResolver();
    eventBus = new MockEventBus();
    useCase = new LoginUseCase(userRepo as any, tokenRepo as any, tokenService as any, permResolver, eventBus as any);
  });

  it('should return tokens on successful login', async () => {
    const { user } = await new UserBuilder().buildWithHashedPassword();
    userRepo.setUser(User.reconstitute({
      id: user.id,
      email: user.email,
      password: require('../../../domain/value-objects/Password').Password.fromHashed(
        await user.password.hash(),
      ),
      role: user.role,
      isActive: true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    const result = await useCase.execute({ email: 'user@test.com', password: 'MyP@ssw0rd!' });
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().accessToken).toBeDefined();
    expect(result.getValue().refreshToken).toBeDefined();
  });

  it('should fail with INVALID_CREDENTIALS when user not found', async () => {
    userRepo.setUser(null);
    const result = await useCase.execute({ email: 'nobody@test.com', password: 'MyP@ssw0rd!' });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('INVALID_CREDENTIALS');
  });

  it('should fail with USER_INACTIVE for inactive user', async () => {
    const { user, hash } = await new UserBuilder().buildWithHashedPassword();
    user.deactivate();
    userRepo.setUser(User.reconstitute({
      id: user.id,
      email: user.email,
      password: require('../../../domain/value-objects/Password').Password.fromHashed(hash),
      role: user.role,
      isActive: false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
    const result = await useCase.execute({ email: 'user@test.com', password: 'MyP@ssw0rd!' });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('USER_INACTIVE');
  });

  it('should fail with INVALID_CREDENTIALS for wrong password', async () => {
    const { user } = await new UserBuilder().buildWithHashedPassword();
    userRepo.setUser(User.reconstitute({
      id: user.id,
      email: user.email,
      password: require('../../../domain/value-objects/Password').Password.fromHashed(
        await user.password.hash(),
      ),
      role: user.role,
      isActive: true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
    const result = await useCase.execute({ email: 'user@test.com', password: 'WrongP@ss1!' });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('INVALID_CREDENTIALS');
  });

  it('should publish UserLoggedIn event', async () => {
    const { user } = await new UserBuilder().buildWithHashedPassword();
    userRepo.setUser(User.reconstitute({
      id: user.id,
      email: user.email,
      password: require('../../../domain/value-objects/Password').Password.fromHashed(
        await user.password.hash(),
      ),
      role: user.role,
      isActive: true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
    await useCase.execute({ email: 'user@test.com', password: 'MyP@ssw0rd!' });
    expect(eventBus.published.length).toBe(1);
    expect(eventBus.published[0].eventType).toBe('auth.user.logged_in');
  });
});
