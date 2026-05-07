import { Payment } from '../Payment';

describe('Payment Entity', () => {
  const validProps = {
    invoiceId: 'inv-001',
    amount: 100,
    paymentDate: new Date('2024-01-15'),
    paymentMethod: 'BANK_TRANSFER',
    reference: 'REF-001',
    notes: 'Payment for invoice',
  };

  describe('create', () => {
    it('should create payment with valid props', () => {
      const result = Payment.create(validProps);

      expect(result.isSuccess()).toBe(true);
      const payment = result.getValue();

      expect(payment.invoiceId).toBe('inv-001');
      expect(payment.amount).toBe(100);
      expect(payment.paymentDate).toEqual(new Date('2024-01-15'));
      expect(payment.paymentMethod).toBe('BANK_TRANSFER');
      expect(payment.reference).toBe('REF-001');
      expect(payment.notes).toBe('Payment for invoice');
      expect(payment.id).toBeDefined();
      expect(payment.createdAt).toBeDefined();

      const events = payment.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.payment.recorded');
    });

    it('should create payment without reference', () => {
      const props = { ...validProps };
      delete (props as any).reference;

      const result = Payment.create(props);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().reference).toBeNull();
    });

    it('should create payment without notes', () => {
      const props = { ...validProps };
      delete (props as any).notes;

      const result = Payment.create(props);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().notes).toBeNull();
    });

    it('should create payment with zero amount should fail', () => {
      const result = Payment.create({ ...validProps, amount: 0 });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PAYMENT_AMOUNT_ZERO');
    });

    it('should fail with negative amount', () => {
      const result = Payment.create({ ...validProps, amount: -10 });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PAYMENT_AMOUNT_INVALID');
    });

    it('should fail with empty invoice ID', () => {
      const result = Payment.create({ ...validProps, invoiceId: '' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PAYMENT_INVOICE_ID_REQUIRED');
    });

    it('should trim reference', () => {
      const result = Payment.create({ ...validProps, reference: '  REF-001  ' });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().reference).toBe('REF-001');
    });

    it('should trim notes', () => {
      const result = Payment.create({ ...validProps, notes: '  Payment notes  ' });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().notes).toBe('Payment notes');
    });

    it('should handle different payment methods', () => {
      const methods = ['CASH', 'CHECK', 'CARD', 'E_WALLET', 'OTHER'];

      for (const method of methods) {
        const result = Payment.create({ ...validProps, paymentMethod: method });
        expect(result.isSuccess()).toBe(true);
        expect(result.getValue().paymentMethod).toBe(method);
      }
    });

    it('should handle decimal amounts', () => {
      const result = Payment.create({ ...validProps, amount: 99.99 });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(99.99);
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'pay-001',
        invoiceId: 'inv-001',
        amount: 100,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'BANK_TRANSFER',
        reference: 'REF-001',
        notes: 'Payment notes',
        createdAt: new Date('2024-01-15'),
      };

      const payment = Payment.reconstitute(state);

      expect(payment.id).toBe(state.id);
      expect(payment.invoiceId).toBe(state.invoiceId);
      expect(payment.amount).toBe(state.amount);
      expect(payment.paymentDate).toEqual(state.paymentDate);
      expect(payment.paymentMethod).toBe(state.paymentMethod);
      expect(payment.reference).toBe(state.reference);
      expect(payment.notes).toBe(state.notes);
      expect(payment.createdAt).toEqual(state.createdAt);
    });

    it('should not generate events on reconstitution', () => {
      const state = {
        id: 'pay-001',
        invoiceId: 'inv-001',
        amount: 100,
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'CASH',
        reference: null,
        notes: null,
        createdAt: new Date('2024-01-15'),
      };

      const payment = Payment.reconstitute(state);
      const events = payment.pullEvents();

      expect(events).toHaveLength(0);
    });
  });
});
