import { JournalEntryStatus } from '../JournalEntryStatus';

describe('JournalEntryStatus', () => {
  describe('create', () => {
    it('should create with "DRAFT"', () => {
      const status = JournalEntryStatus.create('DRAFT');
      expect(status.getValue()).toBe('DRAFT');
    });

    it('should create with "POSTED"', () => {
      const status = JournalEntryStatus.create('POSTED');
      expect(status.getValue()).toBe('POSTED');
    });

    it('should create with "REVERSED"', () => {
      const status = JournalEntryStatus.create('REVERSED');
      expect(status.getValue()).toBe('REVERSED');
    });

    it('should normalize lowercase to uppercase', () => {
      const status = JournalEntryStatus.create('draft');
      expect(status.getValue()).toBe('DRAFT');
    });

    it('should throw for invalid status', () => {
      expect(() => JournalEntryStatus.create('UNKNOWN')).toThrow('INVALID_JOURNAL_ENTRY_STATUS: UNKNOWN');
    });

    it('should throw for empty string', () => {
      expect(() => JournalEntryStatus.create('')).toThrow('INVALID_JOURNAL_ENTRY_STATUS: ');
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const a = JournalEntryStatus.create('POSTED');
      const b = JournalEntryStatus.create('POSTED');
      expect(a.equals(b)).toBe(true);
    });

    it('should return true when comparing normalized values', () => {
      const a = JournalEntryStatus.create('POSTED');
      const b = JournalEntryStatus.create('posted');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different status', () => {
      const a = JournalEntryStatus.create('POSTED');
      const b = JournalEntryStatus.create('DRAFT');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the status string', () => {
      const status = JournalEntryStatus.create('REVERSED');
      expect(status.getValue()).toBe('REVERSED');
    });
  });

  describe('toString', () => {
    it('should return the status string', () => {
      const status = JournalEntryStatus.create('DRAFT');
      expect(status.toString()).toBe('DRAFT');
    });
  });
});
