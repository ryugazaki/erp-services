import { Money } from '../Money';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create with valid amount', () => {
      const money = Money.create(100);
      expect(money.getValue().getAmount()).toBe(100);
      expect(money.getValue().getCurrency()).toBe('USD');
    });

    it('should create with custom currency', () => {
      const money = Money.create(100, 'EUR');
      expect(money.getValue().getAmount()).toBe(100);
      expect(money.getValue().getCurrency()).toBe('EUR');
    });

    it('should round to 2 decimal places', () => {
      const money = Money.create(100.456);
      expect(money.getValue().getAmount()).toBe(100.46);
    });

    it('should handle negative amounts', () => {
      const money = Money.create(-50);
      expect(money.getValue().getAmount()).toBe(-50);
    });

    it('should handle zero', () => {
      const money = Money.create(0);
      expect(money.getValue().getAmount()).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two money values', () => {
      const a = Money.create(100);
      const b = Money.create(50);
      const result = a.add(b);
      expect(result.getAmount()).toBe(150);
    });

    it('should preserve currency', () => {
      const a = Money.create(100, 'EUR');
      const b = Money.create(50, 'EUR');
      const result = a.add(b);
      expect(result.getCurrency()).toBe('EUR');
    });

    it('should throw when adding different currencies', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(50, 'EUR');
      expect(() => a.add(b)).toThrow('Cannot add Money with different currencies');
    });
  });

  describe('subtract', () => {
    it('should subtract two money values', () => {
      const a = Money.create(100);
      const b = Money.create(30);
      const result = a.subtract(b);
      expect(result.getAmount()).toBe(70);
    });

    it('should preserve currency', () => {
      const a = Money.create(100, 'EUR');
      const b = Money.create(30, 'EUR');
      const result = a.subtract(b);
      expect(result.getCurrency()).toBe('EUR');
    });

    it('should throw when subtracting different currencies', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(30, 'EUR');
      expect(() => a.subtract(b)).toThrow('Cannot subtract Money with different currencies');
    });
  });

  describe('multiply', () => {
    it('should multiply by factor', () => {
      const money = Money.create(100);
      const result = money.multiply(1.5);
      expect(result.getAmount()).toBe(150);
    });

    it('should round to 2 decimal places', () => {
      const money = Money.create(100);
      const result = money.multiply(1.555);
      expect(result.getAmount()).toBe(155.5);
    });
  });

  describe('equals', () => {
    it('should return true for equal values', () => {
      const a = Money.create(100);
      const b = Money.create(100);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const a = Money.create(100);
      const b = Money.create(50);
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(100, 'EUR');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('should return true for positive amounts', () => {
      const money = Money.create(100);
      expect(money.isPositive()).toBe(true);
    });

    it('should return false for zero', () => {
      const money = Money.create(0);
      expect(money.isPositive()).toBe(false);
    });

    it('should return false for negative amounts', () => {
      const money = Money.create(-100);
      expect(money.isPositive()).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative amounts', () => {
      const money = Money.create(-100);
      expect(money.isNegative()).toBe(true);
    });

    it('should return false for zero', () => {
      const money = Money.create(0);
      expect(money.isNegative()).toBe(false);
    });

    it('should return false for positive amounts', () => {
      const money = Money.create(100);
      expect(money.isNegative()).toBe(false);
    });
  });

  describe('isZero', () => {
    it('should return true for zero', () => {
      const money = Money.create(0);
      expect(money.isZero()).toBe(true);
    });

    it('should return false for non-zero', () => {
      const money = Money.create(0.01);
      expect(money.isZero()).toBe(false);
    });
  });

  describe('format', () => {
    it('should format USD correctly', () => {
      const money = Money.create(1234.56);
      expect(money.format()).toBe('$1,234.56');
    });

    it('should format EUR correctly', () => {
      const money = Money.create(1234.56, 'EUR');
      expect(money.format()).toBe('€1,234.56');
    });

    it('should format negative values', () => {
      const money = Money.create(-100);
      expect(money.format()).toBe('-$100.00');
    });

    it('should format zero', () => {
      const money = Money.create(0);
      expect(money.format()).toBe('$0.00');
    });
  });

  describe('getAmount', () => {
    it('should return the amount', () => {
      const money = Money.create(100);
      expect(money.getValue().getAmount()).toBe(100);
    });
  });

  describe('getCurrency', () => {
    it('should return the currency', () => {
      const money = Money.create(100, 'GBP');
      expect(money.getValue().getCurrency()).toBe('GBP');
    });
  });
});
