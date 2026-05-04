import { RegisterUseCase } from '../../../application/use-cases/RegisterUseCase';
import { MockUserRepository } from '../../helpers/mocks/MockUserRepository';
import { MockEventBus } from '../../helpers/mocks/MockEventBus';

describe('RegisterUseCase', () => {
  let userRepo: MockUserRepository;
  let eventBus: MockEventBus;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    userRepo = new MockUserRepository();
    eventBus = new MockEventBus();
    useCase = new RegisterUseCase(userRepo as any, eventBus as any);
  });

  it('should register a new user successfully', async () => {
    const result = await useCase.execute({
      email: 'new@test.com',
      password: 'MyP@ssw0rd!',
      role: 'EMPLOYEE',
    });
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().email).toBe('new@test.com');
    expect(result.getValue().role).toBe('EMPLOYEE');
  });

  it('should fail on duplicate email', async () => {
    const existingUser = require('../../../domain/entities/User').User.create({
      email: 'existing@test.com',
      password: 'MyP@ssw0rd!',
      role: 'EMPLOYEE',
    }).getValue();
    userRepo.setUser(existingUser);

    const result = await useCase.execute({
      email: 'existing@test.com',
      password: 'MyP@ssw0rd!',
      role: 'EMPLOYEE',
    });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('should publish UserCreated event', async () => {
    await useCase.execute({
      email: 'new@test.com',
      password: 'MyP@ssw0rd!',
      role: 'EMPLOYEE',
    });
    expect(eventBus.published.length).toBe(1);
    expect(eventBus.published[0].eventType).toBe('auth.user.created');
  });

  it('should save user with hashed password', async () => {
    await useCase.execute({
      email: 'new@test.com',
      password: 'MyP@ssw0rd!',
      role: 'EMPLOYEE',
    });
    const { user, hash } = userRepo.getSaved();
    expect(user).toBeDefined();
    expect(hash).toBeDefined();
    expect(hash).not.toBe('MyP@ssw0rd!');
  });
});
