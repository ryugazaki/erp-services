import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IEmployeeRepository } from '../../../domain/repositories/IEmployeeRepository';
import { UpdateEmployeeDTO } from '../../dtos/employee/UpdateEmployeeDTO';
import { TOKENS } from '../../tokens';

export interface UpdateEmployeeInput extends UpdateEmployeeDTO {
  id: string;
}

export interface UpdateEmployeeResult {
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
export class UpdateEmployeeUseCase implements IUseCase<UpdateEmployeeInput, Result<UpdateEmployeeResult>> {
  constructor(
    @inject(TOKENS.EmployeeRepository) private readonly employeeRepo: IEmployeeRepository,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateEmployeeInput): Promise<Result<UpdateEmployeeResult>> {
    const employee = await this.employeeRepo.findById(input.id);
    if (!employee) return Result.fail('EMPLOYEE_NOT_FOUND');

    const updateResult = employee.updateDetails({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      departmentId: input.departmentId ?? undefined,
      position: input.position,
    });

    if (updateResult.isFailure()) return Result.fail(updateResult.getError());

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
