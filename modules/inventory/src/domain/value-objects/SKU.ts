import { Result } from '@erp/shared/kernel';

export class SKU {
  private constructor(private readonly value: string) {}

  static create(sku: string): Result<SKU> {
    const trimmed = sku.trim();
    if (trimmed.length === 0) {
      return Result.fail('SKU_REQUIRED');
    }
    if (trimmed.length > 50) {
      return Result.fail('SKU_TOO_LONG');
    }
    return Result.ok(new SKU(trimmed.toUpperCase()));
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SKU): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
