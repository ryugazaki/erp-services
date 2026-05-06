import { IEmployeeNumberGenerator } from '../../application/ports/IEmployeeNumberGenerator';

export class MockEmployeeNumberGenerator implements IEmployeeNumberGenerator {
  private nextNumber = 1;
  private prefix = 'EMP';

  async generate(): Promise<string> {
    const num = this.nextNumber++;
    return `${this.prefix}-${String(num).padStart(5, '0')}`;
  }

  setNext(next: number): void {
    this.nextNumber = next;
  }

  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }
}
