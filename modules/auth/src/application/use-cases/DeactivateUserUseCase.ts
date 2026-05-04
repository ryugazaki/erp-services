import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { TOKENS } from '../tokens';

@injectable()
export class DeactivateUserUseCase implements IUseCase<string, Result<void>> {
  constructor(
    @inject(TOKENS.UserRepository) private readonly userRepo: IUserRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(userId: string): Promise<Result<void>> {
    const user = await this.userRepo.findById(userId);
    if (!user) return Result.fail('USER_NOT_FOUND');

    const result = user.deactivate();
    if (result.isFailure()) return Result.fail(result.getError());

    await this.userRepo.update(user);

    const events = user.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok(undefined);
  }
}
