import { DateRange } from '../DateRange';

describe('DateRange', () => {
  describe('create', () => {
    it('should create with valid dates (start before end)', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');
      const result = DateRange.create(start, end);
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().startDate).toBe(start);
      expect(result.getValue().endDate).toBe(end);
    });

    it('should fail when end is before start', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-05');
      const result = DateRange.create(start, end);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVALID_DATE_RANGE');
    });

    it('should succeed when start equals end (same day)', () => {
      const date = new Date('2024-01-01');
      const result = DateRange.create(date, date);
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().startDate).toBe(date);
      expect(result.getValue().endDate).toBe(date);
    });
  });

  describe('totalDays', () => {
    it('should return 1 for same day', () => {
      const date = new Date('2024-01-01');
      const range = DateRange.create(date, date).getValue();
      expect(range.totalDays()).toBe(1);
    });

    it('should return 4 for 3 days apart', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-04');
      const range = DateRange.create(start, end).getValue();
      expect(range.totalDays()).toBe(4);
    });

    it('should return 7 for a full week', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-07');
      const range = DateRange.create(start, end).getValue();
      expect(range.totalDays()).toBe(7);
    });
  });

  describe('equals', () => {
    it('should return true for same start and end dates', () => {
      const start = new Date('2024-01-01T00:00:00.000Z');
      const end = new Date('2024-01-05T00:00:00.000Z');
      const a = DateRange.create(start, end).getValue();
      const b = DateRange.create(start, end).getValue();
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different dates', () => {
      const a = DateRange.create(
        new Date('2024-01-01'),
        new Date('2024-01-05'),
      ).getValue();
      const b = DateRange.create(
        new Date('2024-01-01'),
        new Date('2024-01-06'),
      ).getValue();
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted string with ISO dates', () => {
      const start = new Date('2024-01-01T00:00:00.000Z');
      const end = new Date('2024-01-05T00:00:00.000Z');
      const range = DateRange.create(start, end).getValue();
      expect(range.toString()).toBe(
        `${start.toISOString()} - ${end.toISOString()}`,
      );
    });
  });
});
