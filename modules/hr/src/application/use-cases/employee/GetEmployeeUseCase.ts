import { inject, injectable } from 'tsyringe';
import { IUseCase, Result } from '@erp/shared/kernel';
import { IEmployeeRepository } from '../../../domain/repositories/IEmployeeRepository';
import { TOKENS } from '../../tokens';

export interface GetEmployeeInput {
  id: string;
}

export interface GetEmployeeResult {
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
export class GetEmployeeUseCase implements IUseCase<GetEmployeeInput, Result<GetEmployeeResult>> {
  constructor(
    @inject(TOKENS.EmployeeRepository) private readonly employeeRepo: IEmployeeRepository,
  ) {}

  async execute(input: GetEmployeeInput): Promise<Result<GetEmployeeResult>> {
    const employee = await this.employeeRepo.findById(input.id);
    if (!employee) return Result.fail('EMPLOYEE_NOT_FOUND');

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
