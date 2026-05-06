import { Result } from '@erp/shared/kernel';
import { PhoneNumber } from '../PhoneNumber';

describe('PhoneNumber', () => {
  describe('create', () => {
    it('should create with valid phone "+62812345678"', () => {
      const result = PhoneNumber.create('+62812345678');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('+62812345678');
    });

    it('should create with valid phone "0812345678901" (digits only)', () => {
      const result = PhoneNumber.create('0812345678901');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('0812345678901');
    });

    it('should return ok with empty string when given empty string', () => {
      const result = PhoneNumber.create('');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('');
    });

    it('should return ok with empty string when given undefined', () => {
      const result = PhoneNumber.create(undefined);
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('');
    });

    it('should return ok with empty string when given null', () => {
      const result = PhoneNumber.create(null);
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('');
    });

    it('should fail with invalid format "abc"', () => {
      const result = PhoneNumber.create('abc');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PHONE_INVALID_FORMAT');
    });

    it('should fail with too short digits "123456"', () => {
      const result = PhoneNumber.create('123456');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PHONE_INVALID_FORMAT');
    });

    it('should trim whitespace from valid input', () => {
      const result = PhoneNumber.create('  +62812345678  ');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('+62812345678');
    });

    it('should return ok with empty string for whitespace-only input', () => {
      const result = PhoneNumber.create('   ');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = PhoneNumber.create('+62812345678').getValue();
      const b = PhoneNumber.create('+62812345678').getValue();
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different value', () => {
      const a = PhoneNumber.create('+62812345678').getValue();
      const b = PhoneNumber.create('+62812345679').getValue();
      expect(a.equals(b)).toBe(false);
    });

    it('should return true for two empty phone numbers', () => {
      const a = PhoneNumber.create('').getValue();
      const b = PhoneNumber.create(null).getValue();
      expect(a.equals(b)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the value', () => {
      const phone = PhoneNumber.create('+62812345678').getValue();
      expect(phone.toString()).toBe('+62812345678');
    });

    it('should return empty string for empty phone number', () => {
      const phone = PhoneNumber.create('').getValue();
      expect(phone.toString()).toBe('');
    });
  });
});
