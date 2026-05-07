import type { IEntryNumberGenerator } from '../../application/ports/EntryNumberGenerator';

export class MockEntryNumberGenerator implements IEntryNumberGenerator {
  private counter = 0;
  private prefix = 'JE';

  async generate(): Promise<string> {
    this.counter++;
    return `${this.prefix}-${String(this.counter).padStart(6, '0')}`;
  }

  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  setNext(num: number): void {
    this.counter = num;
  }

  reset(): void {
    this.counter = 0;
  }
}
