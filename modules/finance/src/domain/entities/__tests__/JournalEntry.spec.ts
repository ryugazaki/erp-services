import { JournalEntry } from '../JournalEntry';
import type { JournalLineItem } from '../JournalEntry';

describe('JournalEntry Entity', () => {
  const validProps = {
    date: new Date('2024-01-15'),
    description: 'Monthly rent payment',
    lineItems: [
      {
        accountId: 'acc-001',
        description: 'Rent expense',
        debitAmount: 1000,
        creditAmount: 0,
      },
      {
        accountId: 'acc-002',
        description: 'Cash payment',
        debitAmount: 0,
        creditAmount: 1000,
      },
    ],
  };

  describe('create', () => {
    it('should create a journal entry with valid props', () => {
      const result = JournalEntry.create(validProps, 'JE-00001');

      expect(result.isSuccess()).toBe(true);
      const entry = result.getValue();

      expect(entry.entryNumber).toBe('JE-00001');
      expect(entry.description).toBe('Monthly rent payment');
      expect(entry.date).toEqual(new Date('2024-01-15'));
      expect(entry.lineItems).toHaveLength(2);
      expect(entry.status).toBe('DRAFT');
      expect(entry.postedAt).toBeNull();
      expect(entry.postedBy).toBeNull();
      expect(entry.reversalEntryId).toBeNull();
      expect(entry.id).toBeDefined();
      expect(entry.createdAt).toBeDefined();
      expect(entry.updatedAt).toBeDefined();
    });

    it('should fail with empty description', () => {
      const result = JournalEntry.create({ ...validProps, description: '' }, 'JE-00001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_DESCRIPTION_REQUIRED');
    });

    it('should fail with whitespace description', () => {
      const result = JournalEntry.create({ ...validProps, description: '   ' }, 'JE-00001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_DESCRIPTION_REQUIRED');
    });

    it('should fail with less than 2 line items', () => {
      const result = JournalEntry.create(
        { ...validProps, lineItems: [validProps.lineItems[0]] },
        'JE-00001',
      );

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_NO_LINE_ITEMS');
    });

    it('should fail with no line items', () => {
      const result = JournalEntry.create({ ...validProps, lineItems: [] }, 'JE-00001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_NO_LINE_ITEMS');
    });

    it('should fail with unbalanced entry', () => {
      const result = JournalEntry.create(
        {
          ...validProps,
          lineItems: [
            { accountId: 'acc-001', description: 'Debit', debitAmount: 1000, creditAmount: 0 },
            { accountId: 'acc-002', description: 'Credit', debitAmount: 0, creditAmount: 900 },
          ],
        },
        'JE-00001',
      );

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_UNBALANCED');
    });

    it('should fail with zero amount entry', () => {
      const result = JournalEntry.create(
        {
          ...validProps,
          lineItems: [
            { accountId: 'acc-001', description: 'Zero', debitAmount: 0, creditAmount: 0 },
            { accountId: 'acc-002', description: 'Zero', debitAmount: 0, creditAmount: 0 },
          ],
        },
        'JE-00001',
      );

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_ZERO_AMOUNT');
    });

    it('should fail with both debit and credit on same line', () => {
      const result = JournalEntry.create(
        {
          ...validProps,
          lineItems: [
            { accountId: 'acc-001', description: 'Both', debitAmount: 100, creditAmount: 100 },
            { accountId: 'acc-002', description: 'Both', debitAmount: 100, creditAmount: 100 },
          ],
        },
        'JE-00001',
      );

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_LINE_ITEM_BOTH_DEBIT_CREDIT');
    });

    it('should fail with empty account ID', () => {
      const result = JournalEntry.create(
        {
          ...validProps,
          lineItems: [
            { accountId: '', description: 'No account', debitAmount: 1000, creditAmount: 0 },
            { accountId: 'acc-002', description: 'Credit', debitAmount: 0, creditAmount: 1000 },
          ],
        },
        'JE-00001',
      );

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_INVALID_ACCOUNT');
    });

    it('should trim description', () => {
      const result = JournalEntry.create({ ...validProps, description: '  Monthly rent  ' }, 'JE-00001');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().description).toBe('Monthly rent');
    });

    it('should handle rounding differences', () => {
      const result = JournalEntry.create(
        {
          ...validProps,
          lineItems: [
            { accountId: 'acc-001', description: 'Debit', debitAmount: 1000.005, creditAmount: 0 },
            { accountId: 'acc-002', description: 'Credit', debitAmount: 0, creditAmount: 1000 },
          ],
        },
        'JE-00001',
      );

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'je-001',
        entryNumber: 'JE-00001',
        date: new Date('2024-01-15'),
        description: 'Monthly rent',
        lineItems: [
          { id: 'li-001', accountId: 'acc-001', description: 'Rent', debitAmount: 1000, creditAmount: 0 },
          { id: 'li-002', accountId: 'acc-002', description: 'Cash', debitAmount: 0, creditAmount: 1000 },
        ],
        status: 'POSTED',
        postedAt: new Date('2024-01-15'),
        postedBy: 'user-123',
        reversalEntryId: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const entry = JournalEntry.reconstitute(state);

      expect(entry.id).toBe(state.id);
      expect(entry.entryNumber).toBe(state.entryNumber);
      expect(entry.date).toEqual(state.date);
      expect(entry.description).toBe(state.description);
      expect(entry.lineItems).toEqual(state.lineItems);
      expect(entry.status).toBe(state.status);
      expect(entry.postedAt).toEqual(state.postedAt);
      expect(entry.postedBy).toBe(state.postedBy);
      expect(entry.reversalEntryId).toBe(state.reversalEntryId);
    });

    it('should not generate events on reconstitution', () => {
      const state = {
        id: 'je-001',
        entryNumber: 'JE-00001',
        date: new Date('2024-01-15'),
        description: 'Test',
        lineItems: [
          { id: 'li-001', accountId: 'acc-001', description: 'D', debitAmount: 100, creditAmount: 0 },
          { id: 'li-002', accountId: 'acc-002', description: 'C', debitAmount: 0, creditAmount: 100 },
        ],
        status: 'DRAFT',
        postedAt: null,
        postedBy: null,
        reversalEntryId: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const entry = JournalEntry.reconstitute(state);
      const events = entry.pullEvents();

      expect(events).toHaveLength(0);
    });
  });

  describe('post', () => {
    it('should post draft entry', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();
      entry.pullEvents();

      const result = entry.post('user-123');

      expect(result.isSuccess()).toBe(true);
      expect(entry.status).toBe('POSTED');
      expect(entry.postedAt).toBeDefined();
      expect(entry.postedBy).toBe('user-123');

      const events = entry.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.journal.posted');
    });

    it('should fail if already posted', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();
      entry.post('user-123');

      const result = entry.post('user-456');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_ALREADY_POSTED');
    });

    it('should fail if already reversed', () => {
      const state = {
        id: 'je-001',
        entryNumber: 'JE-00001',
        date: new Date('2024-01-15'),
        description: 'Test',
        lineItems: [
          { id: 'li-001', accountId: 'acc-001', description: 'D', debitAmount: 100, creditAmount: 0 },
          { id: 'li-002', accountId: 'acc-002', description: 'C', debitAmount: 0, creditAmount: 100 },
        ],
        status: 'REVERSED',
        postedAt: new Date('2024-01-15'),
        postedBy: 'user-123',
        reversalEntryId: 'je-002',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };
      const entry = JournalEntry.reconstitute(state);

      const result = entry.post('user-456');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_ALREADY_REVERSED');
    });
  });

  describe('reverse', () => {
    it('should reverse posted entry', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();
      entry.pullEvents();
      entry.post('user-123');
      entry.pullEvents();

      const result = entry.reverse('Correction needed', 'user-456', 'je-002');

      expect(result.isSuccess()).toBe(true);
      expect(entry.status).toBe('REVERSED');
      expect(entry.reversalEntryId).toBe('je-002');

      const events = entry.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.journal.reversed');
    });

    it('should fail if not posted', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();

      const result = entry.reverse('Reason', 'user-123', 'je-002');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_NOT_POSTED');
    });

    it('should fail if already reversed', () => {
      const state = {
        id: 'je-001',
        entryNumber: 'JE-00001',
        date: new Date('2024-01-15'),
        description: 'Test',
        lineItems: [
          { id: 'li-001', accountId: 'acc-001', description: 'D', debitAmount: 100, creditAmount: 0 },
          { id: 'li-002', accountId: 'acc-002', description: 'C', debitAmount: 0, creditAmount: 100 },
        ],
        status: 'REVERSED',
        postedAt: new Date('2024-01-15'),
        postedBy: 'user-123',
        reversalEntryId: 'je-002',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };
      const entry = JournalEntry.reconstitute(state);

      const result = entry.reverse('Another reason', 'user-456', 'je-003');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_ALREADY_REVERSED');
    });
  });

  describe('updateDescription', () => {
    it('should update description for draft entry', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();

      const result = entry.updateDescription('Updated description');

      expect(result.isSuccess()).toBe(true);
      expect(entry.description).toBe('Updated description');
    });

    it('should fail if not draft', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();
      entry.post('user-123');

      const result = entry.updateDescription('Updated description');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_NOT_DRAFT');
    });

    it('should fail with empty description', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();

      const result = entry.updateDescription('');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('JOURNAL_ENTRY_DESCRIPTION_REQUIRED');
    });
  });

  describe('status checks', () => {
    it('should return correct draft status', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();
      expect(entry.isDraft()).toBe(true);
      expect(entry.isPosted()).toBe(false);
      expect(entry.isReversed()).toBe(false);
    });

    it('should return correct posted status', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();
      entry.post('user-123');

      expect(entry.isDraft()).toBe(false);
      expect(entry.isPosted()).toBe(true);
      expect(entry.isReversed()).toBe(false);
    });

    it('should return correct reversed status', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();
      entry.post('user-123');
      entry.reverse('Reason', 'user-456', 'je-002');

      expect(entry.isDraft()).toBe(false);
      expect(entry.isPosted()).toBe(false);
      expect(entry.isReversed()).toBe(true);
    });
  });

  describe('getStatusValue', () => {
    it('should return JournalEntryStatus value object', () => {
      const entry = JournalEntry.create(validProps, 'JE-00001').getValue();
      const status = entry.getStatusValue();

      expect(status.getValue()).toBe('DRAFT');
    });
  });
});
