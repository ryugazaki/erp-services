export type UnitOfMeasureValue = 'PCS' | 'KG' | 'GRAM' | 'LITER' | 'ML' | 'METER' | 'CM' | 'BOX' | 'PACK';

const VALID_UNITS: UnitOfMeasureValue[] = [
  'PCS', 'KG', 'GRAM', 'LITER', 'ML', 'METER', 'CM', 'BOX', 'PACK'
];

export class UnitOfMeasure {
  private constructor(private readonly value: UnitOfMeasureValue) {}

  static create(unit: string): UnitOfMeasure {
    const upper = unit.toUpperCase() as UnitOfMeasureValue;
    if (!VALID_UNITS.includes(upper)) {
      throw new Error(`INVALID_UNIT_OF_MEASURE: ${unit}`);
    }
    return new UnitOfMeasure(upper);
  }

  getValue(): UnitOfMeasureValue {
    return this.value;
  }

  equals(other: UnitOfMeasure): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
