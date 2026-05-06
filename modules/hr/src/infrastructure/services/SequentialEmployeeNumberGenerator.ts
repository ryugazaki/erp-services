import { injectable } from 'tsyringe';
import { Kysely } from 'kysely';
import { IEmployeeNumberGenerator } from '../../application/ports/IEmployeeNumberGenerator';

@injectable()
export class SequentialEmployeeNumberGenerator implements IEmployeeNumberGenerator {
  constructor(private readonly db: Kysely<any>) {}

  async generate(): Promise<string> {
    const result = await this.db
      .selectFrom('hr.employees')
      .select(this.db.fn.max('employee_number').as('max_number'))
      .executeTakeFirst();

    const lastNum = result?.max_number
      ? parseInt(result.max_number.replace('EMP-', ''), 10)
      : 0;
    const nextNum = lastNum + 1;
    return `EMP-${String(nextNum).padStart(5, '0')}`;
  }
}
