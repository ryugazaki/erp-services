import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { RegisterDTO } from '../dtos/RegisterDTO';
import { TOKENS } from '../tokens';

export interface RegisterResult {
  id: string;
  email: string;
  role: string;
}

@injectable()
export class RegisterUseCase implements IUseCase<RegisterDTO, Result<RegisterResult>> {
  constructor(
    @inject(TOKENS.UserRepository) private readonly userRepo: IUserRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: RegisterDTO): Promise<Result<RegisterResult>> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) return Result.fail('EMAIL_ALREADY_EXISTS');

    const userResult = User.create({
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
    if (userResult.isFailure()) return Result.fail(userResult.getError());

    const user = userResult.getValue();

    const hashedPassword = await user.password.hash();
    await this.userRepo.save(user, hashedPassword);

    const events = user.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({ id: user.id, email: user.email.value, role: user.role });
  }
}
