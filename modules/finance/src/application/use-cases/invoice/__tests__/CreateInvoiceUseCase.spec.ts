import { CreateInvoiceUseCase } from '../CreateInvoiceUseCase';
import { MockInvoiceRepository } from '../../../../tests/mocks/MockInvoiceRepository';
import { MockInvoiceNumberGenerator } from '../../../../tests/mocks/MockInvoiceNumberGenerator';
import { MockEventBus } from '../../../../tests/mocks/MockEventBus';

describe('CreateInvoiceUseCase', () => {
  let useCase: CreateInvoiceUseCase;
  let invoiceRepo: MockInvoiceRepository;
  let numberGenerator: MockInvoiceNumberGenerator;
  let eventBus: MockEventBus;

  beforeEach(() => {
    jest.clearAllMocks();
    invoiceRepo = new MockInvoiceRepository();
    numberGenerator = new MockInvoiceNumberGenerator();
    eventBus = new MockEventBus();
    useCase = new CreateInvoiceUseCase(invoiceRepo, numberGenerator, eventBus);
  });

  it('should create receivable invoice with valid props', async () => {
    const dto = {
      type: 'RECEIVABLE' as const,
      customerId: 'customer-123',
      customerName: 'Acme Corp',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Product A', quantity: 2, unitPrice: 100, taxRate: 10 },
        { description: 'Product B', quantity: 1, unitPrice: 50, taxRate: 10 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    const invoice = result.getValue();
    expect(invoice.invoiceNumber).toBe('INV-20240115-0001');
    expect(invoice.type).toBe('RECEIVABLE');
    expect(invoice.customerId).toBe('customer-123');
    expect(invoice.customerName).toBe('Acme Corp');
    expect(invoice.subTotal).toBe(250);
    expect(invoice.taxAmount).toBe(25);
    expect(invoice.totalAmount).toBe(275);
    expect(invoice.status).toBe('DRAFT');

    const savedInvoice = await invoiceRepo.findById(invoice.id);
    expect(savedInvoice).toBeDefined();

    expect(eventBus.publishedEvents.length).toBeGreaterThan(0);
    expect(eventBus.publishedEvents[0].eventType).toBe('finance.invoice.created');
  });

  it('should create payable invoice with valid props', async () => {
    const dto = {
      type: 'PAYABLE' as const,
      customerId: 'vendor-123',
      customerName: 'Supplier Inc',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 500, taxRate: 20 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    const invoice = result.getValue();
    expect(invoice.invoiceNumber).toBe('BL-20240115-0001');
    expect(invoice.type).toBe('PAYABLE');
    expect(invoice.totalAmount).toBe(600);
  });

  it('should fail with invalid type', async () => {
    const dto = {
      type: 'INVALID' as any,
      customerId: 'customer-123',
      customerName: 'Acme Corp',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toContain('INVALID_INVOICE_TYPE');
  });

  it('should fail with empty customer ID', async () => {
    const dto = {
      type: 'RECEIVABLE' as const,
      customerId: '',
      customerName: 'Acme Corp',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('INVOICE_CUSTOMER_ID_REQUIRED');
  });

  it('should fail with empty customer name', async () => {
    const dto = {
      type: 'RECEIVABLE' as const,
      customerId: 'customer-123',
      customerName: '',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('INVOICE_CUSTOMER_NAME_REQUIRED');
  });

  it('should fail with no line items', async () => {
    const dto = {
      type: 'RECEIVABLE' as const,
      customerId: 'customer-123',
      customerName: 'Acme Corp',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [],
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('INVOICE_NO_LINE_ITEMS');
  });

  it('should calculate totals correctly with zero tax', async () => {
    const dto = {
      type: 'RECEIVABLE' as const,
      customerId: 'customer-123',
      customerName: 'Acme Corp',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Product', quantity: 1, unitPrice: 100, taxRate: 0 },
      ],
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    const invoice = result.getValue();
    expect(invoice.subTotal).toBe(100);
    expect(invoice.taxAmount).toBe(0);
    expect(invoice.totalAmount).toBe(100);
  });

  it('should include notes when provided', async () => {
    const dto = {
      type: 'RECEIVABLE' as const,
      customerId: 'customer-123',
      customerName: 'Acme Corp',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 },
      ],
      notes: 'Payment terms: 30 days',
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue().notes).toBe('Payment terms: 30 days');
  });

  it('should generate sequential invoice numbers', async () => {
    const dto = {
      type: 'RECEIVABLE' as const,
      customerId: 'customer-123',
      customerName: 'Acme Corp',
      date: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Product', quantity: 1, unitPrice: 100, taxRate: 10 },
      ],
    };

    const result1 = await useCase.execute(dto);
    const result2 = await useCase.execute(dto);

    expect(result1.getValue().invoiceNumber).toBe('INV-20240115-0001');
    expect(result2.getValue().invoiceNumber).toBe('INV-20240115-0002');
  });
});
