import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEventBus } from '@erp/core/event-bus';
import { IEmployeeRepository } from '../../../domain/repositories/IEmployeeRepository';
import { IEmployeeNumberGenerator } from '../../ports/IEmployeeNumberGenerator';
import { IUserAccountCreator } from '../../ports/IUserAccountCreator';
import { Employee } from '../../../domain/entities/Employee';
import { CreateEmployeeDTO } from '../../dtos/employee/CreateEmployeeDTO';
import { TOKENS } from '../../tokens';

export interface CreateEmployeeResult {
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
  userId: string;
  temporaryPassword: string;
}

@injectable()
export class CreateEmployeeUseCase implements IUseCase<CreateEmployeeDTO, Result<CreateEmployeeResult>> {
  constructor(
    @inject(TOKENS.EmployeeRepository) private readonly employeeRepo: IEmployeeRepository,
    @inject(TOKENS.EmployeeNumberGenerator) private readonly employeeNumberGenerator: IEmployeeNumberGenerator,
    @inject(TOKENS.UserAccountCreator) private readonly userAccountCreator: IUserAccountCreator,
    @inject(TOKENS.EventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateEmployeeDTO): Promise<Result<CreateEmployeeResult>> {
    const existing = await this.employeeRepo.findByEmail(dto.email);
    if (existing) return Result.fail('EMPLOYEE_EMAIL_EXISTS');

    const employeeNumber = await this.employeeNumberGenerator.generate();

    const employeeResult = Employee.create({
      employeeNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      departmentId: dto.departmentId,
      position: dto.position,
      hireDate: dto.hireDate,
    });

    if (employeeResult.isFailure()) return Result.fail(employeeResult.getError());

    const employee = employeeResult.getValue();

    const { userId, temporaryPassword } = await this.userAccountCreator.createAccount(dto.email, 'EMPLOYEE');

    employee.linkUser(userId);

    await this.employeeRepo.save(employee);

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
      userId: employee.userId!,
      temporaryPassword,
    });
  }
}
