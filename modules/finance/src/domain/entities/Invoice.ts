import { AggregateRoot, Result } from '@erp/shared/kernel';
import { InvoiceType } from '../value-objects/InvoiceType';
import { InvoiceStatus } from '../value-objects/InvoiceStatus';
import { Money } from '../value-objects/Money';
import { InvoiceCreated } from '../events/InvoiceCreated';
import { InvoiceValidated } from '../events/InvoiceValidated';
import { InvoicePaid } from '../events/InvoicePaid';
import { InvoiceCancelled } from '../events/InvoiceCancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface CreateLineItemProps {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface InvoiceState {
  id: string;
  invoiceNumber: string;
  type: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceProps {
  type: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate: Date;
  lineItems: CreateLineItemProps[];
  notes?: string;
}

export class Invoice extends AggregateRoot {
  private constructor(private state: InvoiceState) {
    super();
  }

  get id(): string { return this.state.id; }
  get invoiceNumber(): string { return this.state.invoiceNumber; }
  get type(): string { return this.state.type; }
  get customerId(): string { return this.state.customerId; }
  get customerName(): string { return this.state.customerName; }
  get date(): Date { return this.state.date; }
  get dueDate(): Date { return this.state.dueDate; }
  get lineItems(): InvoiceLineItem[] { return [...this.state.lineItems]; }
  get subTotal(): number { return this.state.subTotal; }
  get taxAmount(): number { return this.state.taxAmount; }
  get totalAmount(): number { return this.state.totalAmount; }
  get paidAmount(): number { return this.state.paidAmount; }
  get status(): string { return this.state.status; }
  get notes(): string | null { return this.state.notes; }
  get outstandingAmount(): number { return this.state.totalAmount - this.state.paidAmount; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateInvoiceProps, invoiceNumber: string): Result<Invoice> {
    const typeResult = InvoiceType.create(props.type);
    if (typeResult.isFailure()) {
      return Result.fail(typeResult.getError());
    }

    if (!props.customerId || props.customerId.trim().length === 0) {
      return Result.fail('INVOICE_CUSTOMER_ID_REQUIRED');
    }

    if (!props.customerName || props.customerName.trim().length === 0) {
      return Result.fail('INVOICE_CUSTOMER_NAME_REQUIRED');
    }

    if (!props.lineItems || props.lineItems.length === 0) {
      return Result.fail('INVOICE_NO_LINE_ITEMS');
    }

    const lineItemsResult = Invoice.validateAndCalculateLineItems(props.lineItems);
    if (lineItemsResult.isFailure()) {
      return Result.fail(lineItemsResult.getError());
    }

    const { lineItems, subTotal, taxAmount, totalAmount } = lineItemsResult.getValue();

    const now = new Date();
    const invoice = new Invoice({
      id: crypto.randomUUID(),
      invoiceNumber,
      type: typeResult.getValue().value,
      customerId: props.customerId.trim(),
      customerName: props.customerName.trim(),
      date: props.date,
      dueDate: props.dueDate,
      lineItems,
      subTotal,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      status: 'DRAFT',
      notes: props.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });

    invoice.recordEvent(new InvoiceCreated(
      invoice.id,
      invoice.invoiceNumber,
      invoice.type,
      invoice.totalAmount,
    ));

    return Result.ok(invoice);
  }

  static reconstitute(state: InvoiceState): Invoice {
    return new Invoice(state);
  }

  private static validateAndCalculateLineItems(items: CreateLineItemProps[]): Result<{
    lineItems: InvoiceLineItem[];
    subTotal: number;
    taxAmount: number;
    totalAmount: number;
  }> {
    const lineItems: InvoiceLineItem[] = [];
    let subTotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      if (!item.description || item.description.trim().length === 0) {
        return Result.fail('INVOICE_LINE_ITEM_DESCRIPTION_REQUIRED');
      }

      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return Result.fail('INVOICE_LINE_ITEM_INVALID_QUANTITY');
      }

      const unitPrice = Number(item.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        return Result.fail('INVOICE_LINE_ITEM_INVALID_UNIT_PRICE');
      }

      const taxRate = Number(item.taxRate);
      if (isNaN(taxRate) || taxRate < 0) {
        return Result.fail('INVOICE_LINE_ITEM_INVALID_TAX_RATE');
      }

      const netAmount = quantity * unitPrice;
      const tax = netAmount * (taxRate / 100);
      const total = netAmount + tax;

      subTotal += netAmount;
      taxAmount += tax;

      lineItems.push({
        id: crypto.randomUUID(),
        description: item.description.trim(),
        quantity,
        unitPrice,
        taxRate,
        total,
      });
    }

    const totalAmount = subTotal + taxAmount;

    return Result.ok({
      lineItems,
      subTotal: Math.round(subTotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  }

  validate(): Result<void> {
    const currentStatus = InvoiceStatus.fromValue(this.state.status as any);

    if (!currentStatus.isDraft()) {
      return Result.fail('INVOICE_NOT_DRAFT');
    }

    this.state.status = 'PENDING';
    this.state.updatedAt = new Date();

    this.recordEvent(new InvoiceValidated(
      this.id,
      this.invoiceNumber,
      this.totalAmount,
    ));

    return Result.ok(undefined);
  }

  recordPayment(amount: number, paymentId: string): Result<void> {
    const amountResult = Money.create(amount);
    if (amountResult.isFailure()) {
      return Result.fail('PAYMENT_AMOUNT_INVALID');
    }

    const payment = amountResult.getValue();
    const newPaidAmount = this.state.paidAmount + payment.amount;

    if (newPaidAmount > this.state.totalAmount) {
      return Result.fail('INVOICE_OVERPAYMENT');
    }

    this.state.paidAmount = Math.round(newPaidAmount * 100) / 100;
    this.state.updatedAt = new Date();

    if (this.state.paidAmount >= this.state.totalAmount - 0.01) {
      this.state.status = 'PAID';
      this.recordEvent(new InvoicePaid(this.id, paymentId, payment.amount));
    }

    return Result.ok(undefined);
  }

  markAsPaid(): Result<void> {
    const currentStatus = InvoiceStatus.fromValue(this.state.status as any);

    if (currentStatus.isPaid()) {
      return Result.fail('INVOICE_ALREADY_PAID');
    }

    if (currentStatus.isCancelled()) {
      return Result.fail('INVOICE_IS_CANCELLED');
    }

    this.state.status = 'PAID';
    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }

  cancel(reason?: string): Result<void> {
    const currentStatus = InvoiceStatus.fromValue(this.state.status as any);

    if (currentStatus.isFinal()) {
      return Result.fail('INVOICE_CANNOT_CANCEL');
    }

    this.state.status = 'CANCELLED';
    this.state.notes = reason?.trim() || this.state.notes;
    this.state.updatedAt = new Date();

    this.recordEvent(new InvoiceCancelled(this.id, reason?.trim() || null));

    return Result.ok(undefined);
  }

  checkOverdue(): void {
    if (this.state.status !== 'PENDING') {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(this.state.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      this.state.status = 'OVERDUE';
      this.state.updatedAt = new Date();
    }
  }

  update(props: { date?: Date; dueDate?: Date; lineItems?: CreateLineItemProps[]; notes?: string }): Result<void> {
    const currentStatus = InvoiceStatus.fromValue(this.state.status as any);

    if (!currentStatus.isDraft()) {
      return Result.fail('INVOICE_NOT_DRAFT');
    }

    if (props.date) {
      this.state.date = props.date;
    }

    if (props.dueDate) {
      this.state.dueDate = props.dueDate;
    }

    if (props.lineItems) {
      if (props.lineItems.length === 0) {
        return Result.fail('INVOICE_NO_LINE_ITEMS');
      }

      const lineItemsResult = Invoice.validateAndCalculateLineItems(props.lineItems);
      if (lineItemsResult.isFailure()) {
        return Result.fail(lineItemsResult.getError());
      }

      const { lineItems, subTotal, taxAmount, totalAmount } = lineItemsResult.getValue();
      this.state.lineItems = lineItems;
      this.state.subTotal = subTotal;
      this.state.taxAmount = taxAmount;
      this.state.totalAmount = totalAmount;
    }

    if (props.notes !== undefined) {
      this.state.notes = props.notes?.trim() || null;
    }

    this.state.updatedAt = new Date();

    return Result.ok(undefined);
  }

  getTypeValue(): InvoiceType {
    return InvoiceType.fromValue(this.state.type as any);
  }

  getStatusValue(): InvoiceStatus {
    return InvoiceStatus.fromValue(this.state.status as any);
  }

  isDraft(): boolean { return this.state.status === 'DRAFT'; }
  isPending(): boolean { return this.state.status === 'PENDING'; }
  isPaid(): boolean { return this.state.status === 'PAID'; }
  isOverdue(): boolean { return this.state.status === 'OVERDUE'; }
  isCancelled(): boolean { return this.state.status === 'CANCELLED'; }
  isFullyPaid(): boolean { return this.state.paidAmount >= this.state.totalAmount - 0.01; }
}
