import { Invoice } from '../Invoice';

describe('Invoice Entity', () => {
  const validProps = {
    type: 'RECEIVABLE',
    customerId: 'customer-123',
    customerName: 'Acme Corp',
    date: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    lineItems: [
      { description: 'Product A', quantity: 2, unitPrice: 100, taxRate: 10 },
      { description: 'Product B', quantity: 1, unitPrice: 50, taxRate: 10 },
    ],
  };

  describe('create', () => {
    it('should create invoice with valid props', () => {
      const result = Invoice.create(validProps, 'INV-2024-001');

      expect(result.isSuccess()).toBe(true);
      const invoice = result.getValue();

      expect(invoice.invoiceNumber).toBe('INV-2024-001');
      expect(invoice.type).toBe('RECEIVABLE');
      expect(invoice.customerId).toBe('customer-123');
      expect(invoice.customerName).toBe('Acme Corp');
      expect(invoice.date).toEqual(new Date('2024-01-15'));
      expect(invoice.dueDate).toEqual(new Date('2024-02-15'));
      expect(invoice.lineItems).toHaveLength(2);
      expect(invoice.subTotal).toBe(250);
      expect(invoice.taxAmount).toBe(25);
      expect(invoice.totalAmount).toBe(275);
      expect(invoice.paidAmount).toBe(0);
      expect(invoice.outstandingAmount).toBe(275);
      expect(invoice.status).toBe('DRAFT');
      expect(invoice.notes).toBeNull();

      const events = invoice.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.invoice.created');
    });

    it('should calculate totals correctly', () => {
      const result = Invoice.create(validProps, 'INV-001');

      expect(result.isSuccess()).toBe(true);
      const invoice = result.getValue();

      expect(invoice.lineItems[0].total).toBe(220);
      expect(invoice.lineItems[1].total).toBe(55);
    });

    it('should handle zero tax', () => {
      const props = {
        ...validProps,
        lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0 }],
      };
      const result = Invoice.create(props, 'INV-001');

      expect(result.isSuccess()).toBe(true);
      const invoice = result.getValue();

      expect(invoice.subTotal).toBe(100);
      expect(invoice.taxAmount).toBe(0);
      expect(invoice.totalAmount).toBe(100);
    });

    it('should fail with invalid type', () => {
      const result = Invoice.create({ ...validProps, type: 'INVALID' }, 'INV-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('INVALID_INVOICE_TYPE');
    });

    it('should fail with empty customer ID', () => {
      const result = Invoice.create({ ...validProps, customerId: '' }, 'INV-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_CUSTOMER_ID_REQUIRED');
    });

    it('should fail with empty customer name', () => {
      const result = Invoice.create({ ...validProps, customerName: '' }, 'INV-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_CUSTOMER_NAME_REQUIRED');
    });

    it('should fail with no line items', () => {
      const result = Invoice.create({ ...validProps, lineItems: [] }, 'INV-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_NO_LINE_ITEMS');
    });

    it('should fail with line item missing description', () => {
      const props = {
        ...validProps,
        lineItems: [{ description: '', quantity: 1, unitPrice: 100, taxRate: 10 }],
      };
      const result = Invoice.create(props, 'INV-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_LINE_ITEM_DESCRIPTION_REQUIRED');
    });

    it('should fail with invalid quantity', () => {
      const props = {
        ...validProps,
        lineItems: [{ description: 'Product', quantity: -1, unitPrice: 100, taxRate: 10 }],
      };
      const result = Invoice.create(props, 'INV-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_LINE_ITEM_INVALID_QUANTITY');
    });

    it('should fail with negative unit price', () => {
      const props = {
        ...validProps,
        lineItems: [{ description: 'Product', quantity: 1, unitPrice: -10, taxRate: 10 }],
      };
      const result = Invoice.create(props, 'INV-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_LINE_ITEM_INVALID_UNIT_PRICE');
    });

    it('should fail with negative tax rate', () => {
      const props = {
        ...validProps,
        lineItems: [{ description: 'Product', quantity: 1, unitPrice: 100, taxRate: -5 }],
      };
      const result = Invoice.create(props, 'INV-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_LINE_ITEM_INVALID_TAX_RATE');
    });

    it('should trim customer name', () => {
      const result = Invoice.create({ ...validProps, customerName: '  Acme Corp  ' }, 'INV-001');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().customerName).toBe('Acme Corp');
    });

    it('should handle notes', () => {
      const props = { ...validProps, notes: 'Payment terms: 30 days' };
      const result = Invoice.create(props, 'INV-001');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().notes).toBe('Payment terms: 30 days');
    });
  });

  describe('reconstitute', () => {
    it('should preserve all state', () => {
      const state = {
        id: 'inv-001',
        invoiceNumber: 'INV-2024-001',
        type: 'RECEIVABLE',
        customerId: 'customer-123',
        customerName: 'Acme Corp',
        date: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        lineItems: [
          { id: 'li-001', description: 'Product A', quantity: 2, unitPrice: 100, taxRate: 10, total: 220 },
          { id: 'li-002', description: 'Product B', quantity: 1, unitPrice: 50, taxRate: 10, total: 55 },
        ],
        subTotal: 250,
        taxAmount: 25,
        totalAmount: 275,
        paidAmount: 100,
        status: 'PENDING',
        notes: 'Test notes',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      const invoice = Invoice.reconstitute(state);

      expect(invoice.id).toBe(state.id);
      expect(invoice.invoiceNumber).toBe(state.invoiceNumber);
      expect(invoice.type).toBe(state.type);
      expect(invoice.customerId).toBe(state.customerId);
      expect(invoice.customerName).toBe(state.customerName);
      expect(invoice.date).toEqual(state.date);
      expect(invoice.dueDate).toEqual(state.dueDate);
      expect(invoice.lineItems).toEqual(state.lineItems);
      expect(invoice.subTotal).toBe(state.subTotal);
      expect(invoice.taxAmount).toBe(state.taxAmount);
      expect(invoice.totalAmount).toBe(state.totalAmount);
      expect(invoice.paidAmount).toBe(state.paidAmount);
      expect(invoice.outstandingAmount).toBe(175);
      expect(invoice.status).toBe(state.status);
      expect(invoice.notes).toBe(state.notes);
    });
  });

  describe('validate', () => {
    it('should change status from DRAFT to PENDING', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.pullEvents();

      const result = invoice.validate();

      expect(result.isSuccess()).toBe(true);
      expect(invoice.status).toBe('PENDING');

      const events = invoice.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.invoice.validated');
    });

    it('should fail if not draft', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.validate();

      const result = invoice.validate();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_NOT_DRAFT');
    });
  });

  describe('recordPayment', () => {
    it('should record partial payment', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();

      const result = invoice.recordPayment(100, 'payment-001');

      expect(result.isSuccess()).toBe(true);
      expect(invoice.paidAmount).toBe(100);
      expect(invoice.status).toBe('DRAFT');
      expect(invoice.outstandingAmount).toBe(175);
    });

    it('should mark as paid when fully paid', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.pullEvents();
      invoice.validate();
      invoice.pullEvents();

      const result = invoice.recordPayment(275, 'payment-001');

      expect(result.isSuccess()).toBe(true);
      expect(invoice.paidAmount).toBe(275);
      expect(invoice.status).toBe('PAID');

      const events = invoice.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.invoice.paid');
    });

    it('should fail with overpayment', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();

      const result = invoice.recordPayment(300, 'payment-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_OVERPAYMENT');
    });

    it('should fail with negative amount', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();

      const result = invoice.recordPayment(-10, 'payment-001');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('PAYMENT_AMOUNT_INVALID');
    });
  });

  describe('markAsPaid', () => {
    it('should mark pending invoice as paid', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.validate();

      const result = invoice.markAsPaid();

      expect(result.isSuccess()).toBe(true);
      expect(invoice.status).toBe('PAID');
    });

    it('should fail if already paid', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.validate();
      invoice.markAsPaid();

      const result = invoice.markAsPaid();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_ALREADY_PAID');
    });

    it('should fail if cancelled', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.cancel();

      const result = invoice.markAsPaid();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_IS_CANCELLED');
    });
  });

  describe('cancel', () => {
    it('should cancel draft invoice', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.pullEvents();

      const result = invoice.cancel('Customer request');

      expect(result.isSuccess()).toBe(true);
      expect(invoice.status).toBe('CANCELLED');
      expect(invoice.notes).toBe('Customer request');

      const events = invoice.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('finance.invoice.cancelled');
    });

    it('should fail if already paid', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.validate();
      invoice.recordPayment(275, 'payment-001');

      const result = invoice.cancel();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_CANNOT_CANCEL');
    });
  });

  describe('checkOverdue', () => {
    it('should change PENDING to OVERDUE when past due date', () => {
      const invoice = Invoice.create(
        {
          ...validProps,
          dueDate: new Date('2024-01-01'),
        },
        'INV-001',
      ).getValue();
      invoice.validate();

      invoice.checkOverdue();

      expect(invoice.status).toBe('OVERDUE');
    });

    it('should not change DRAFT status', () => {
      const invoice = Invoice.create(
        {
          ...validProps,
          dueDate: new Date('2024-01-01'),
        },
        'INV-001',
      ).getValue();

      invoice.checkOverdue();

      expect(invoice.status).toBe('DRAFT');
    });

    it('should not change PAID status', () => {
      const invoice = Invoice.create(
        {
          ...validProps,
          dueDate: new Date('2024-01-01'),
        },
        'INV-001',
      ).getValue();
      invoice.validate();
      invoice.recordPayment(275, 'payment-001');

      invoice.checkOverdue();

      expect(invoice.status).toBe('PAID');
    });
  });

  describe('update', () => {
    it('should update date', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      const newDate = new Date('2024-02-01');

      const result = invoice.update({ date: newDate });

      expect(result.isSuccess()).toBe(true);
      expect(invoice.date).toEqual(newDate);
    });

    it('should update due date', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      const newDueDate = new Date('2024-03-01');

      const result = invoice.update({ dueDate: newDueDate });

      expect(result.isSuccess()).toBe(true);
      expect(invoice.dueDate).toEqual(newDueDate);
    });

    it('should update line items and recalculate totals', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      const newLineItems = [{ description: 'New Product', quantity: 1, unitPrice: 200, taxRate: 10 }];

      const result = invoice.update({ lineItems: newLineItems });

      expect(result.isSuccess()).toBe(true);
      expect(invoice.lineItems).toHaveLength(1);
      expect(invoice.subTotal).toBe(200);
      expect(invoice.totalAmount).toBe(220);
    });

    it('should update notes', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();

      const result = invoice.update({ notes: 'Updated notes' });

      expect(result.isSuccess()).toBe(true);
      expect(invoice.notes).toBe('Updated notes');
    });

    it('should fail if not draft', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.validate();

      const result = invoice.update({ notes: 'Updated' });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_NOT_DRAFT');
    });

    it('should fail with empty line items', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();

      const result = invoice.update({ lineItems: [] });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('INVOICE_NO_LINE_ITEMS');
    });
  });

  describe('status checks', () => {
    it('should return correct draft status', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      expect(invoice.isDraft()).toBe(true);
      expect(invoice.isPending()).toBe(false);
      expect(invoice.isPaid()).toBe(false);
      expect(invoice.isOverdue()).toBe(false);
      expect(invoice.isCancelled()).toBe(false);
    });

    it('should return correct pending status', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.validate();

      expect(invoice.isDraft()).toBe(false);
      expect(invoice.isPending()).toBe(true);
    });

    it('should return correct paid status', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.validate();
      invoice.recordPayment(275, 'payment-001');

      expect(invoice.isPaid()).toBe(true);
      expect(invoice.isFullyPaid()).toBe(true);
    });

    it('should check fully paid with rounding', () => {
      const invoice = Invoice.create(validProps, 'INV-001').getValue();
      invoice.validate();
      invoice.recordPayment(274.99, 'payment-001');

      expect(invoice.isFullyPaid()).toBe(true);
    });
  });
});
