import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IEmployeeRepository } from '../../../domain/repositories/IEmployeeRepository';
import { TOKENS } from '../../tokens';

export interface ChangeEmployeeStatusInput {
  id: string;
  status: string;
}

export interface ChangeEmployeeStatusResult {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string | null;
  departmentId: string | null;
  hireDate: Date;
  status: string;
  userId: string | null;
}

@injectable()
export class ChangeEmployeeStatusUseCase implements IUseCase<ChangeEmployeeStatusInput, Result<ChangeEmployeeStatusResult>> {
  constructor(
    @inject(TOKENS.EmployeeRepository) private readonly employeeRepo: IEmployeeRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ChangeEmployeeStatusInput): Promise<Result<ChangeEmployeeStatusResult>> {
    const employee = await this.employeeRepo.findById(input.id);
    if (!employee) return Result.fail('EMPLOYEE_NOT_FOUND');

    const result = employee.changeStatus(input.status);
    if (result.isFailure()) return Result.fail(result.getError());

    await this.employeeRepo.update(employee);

    const events = employee.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return Result.ok({
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      departmentId: employee.departmentId,
      hireDate: employee.hireDate,
      status: employee.status,
      userId: employee.userId,
    });
  }
}
