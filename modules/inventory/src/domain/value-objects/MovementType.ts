export type MovementTypeValue = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

const VALID_TYPES: MovementTypeValue[] = ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'];

export class MovementType {
  private constructor(private readonly value: MovementTypeValue) {}

  static create(type: string): MovementType {
    const upper = type.toUpperCase() as MovementTypeValue;
    if (!VALID_TYPES.includes(upper)) {
      throw new Error(`INVALID_MOVEMENT_TYPE: ${type}`);
    }
    return new MovementType(upper);
  }

  getValue(): MovementTypeValue {
    return this.value;
  }

  equals(other: MovementType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isInbound(): boolean {
    return this.value === 'IN';
  }

  isOutbound(): boolean {
    return this.value === 'OUT';
  }
}
