import { Router, RequestHandler } from 'express';
import { validate } from '@erp/core/http';
import { AccountController } from './AccountController';
import { JournalEntryController } from './JournalEntryController';
import { InvoiceController } from './InvoiceController';
import { ReportController } from './ReportController';
import { CreateAccountSchema } from '../../application/dtos/account/CreateAccountDTO';
import { UpdateAccountSchema } from '../../application/dtos/account/UpdateAccountDTO';
import { ListAccountsSchema } from '../../application/dtos/account/ListAccountsDTO';
import { CreateJournalEntrySchema } from '../../application/dtos/journal-entry/CreateJournalEntryDTO';
import { ListJournalEntriesSchema } from '../../application/dtos/journal-entry/ListJournalEntriesDTO';
import { UpdateJournalEntrySchema } from '../../application/dtos/journal-entry/UpdateJournalEntryDTO';
import { ReverseJournalEntrySchema } from '../../application/dtos/journal-entry/ReverseJournalEntryDTO';
import { CreateInvoiceSchema } from '../../application/dtos/invoice/CreateInvoiceDTO';
import { UpdateInvoiceSchema } from '../../application/dtos/invoice/UpdateInvoiceDTO';
import { ListInvoicesSchema } from '../../application/dtos/invoice/ListInvoicesDTO';
import { ChangeInvoiceStatusSchema } from '../../application/dtos/invoice/ChangeInvoiceStatusDTO';
import { RecordPaymentSchema } from '../../application/dtos/payment/RecordPaymentDTO';
import { BalanceSheetQuerySchema } from '../../application/dtos/report/BalanceSheetQueryDTO';
import { IncomeStatementQuerySchema } from '../../application/dtos/report/IncomeStatementQueryDTO';
import { CashFlowQuerySchema } from '../../application/dtos/report/CashFlowQueryDTO';

/**
 * @swagger
 * tags:
 *   - name: Finance
 *     description: Finance Module — accounts, journal entries, invoices, and financial reports
 */

export function createFinanceRoutes(
  accountController: AccountController,
  journalEntryController: JournalEntryController,
  invoiceController: InvoiceController,
  reportController: ReportController,
  authenticate: RequestHandler,
  requirePermission: (...permissions: string[]) => RequestHandler,
): Router {
  const router = Router();

  // ─── Account Routes ──────────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/finance/accounts:
   *   post:
   *     tags: [Finance]
   *     summary: Create a new account
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAccountRequest'
   *     responses:
   *       201:
   *         description: Account created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Account'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Duplicate account code
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/accounts',
    authenticate,
    requirePermission('finance:accounts:write'),
    validate(CreateAccountSchema),
    accountController.create,
  );

  /**
   * @swagger
   * /v1/finance/accounts:
   *   get:
   *     tags: [Finance]
   *     summary: List accounts with pagination and filters
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: type
   *         schema: { type: string, enum: [ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE] }
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Paginated list of accounts
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Account'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   */
  router.get(
    '/accounts',
    authenticate,
    requirePermission('finance:accounts:read'),
    validate(ListAccountsSchema),
    accountController.list,
  );

  /**
   * @swagger
   * /v1/finance/accounts/{id}:
   *   get:
   *     tags: [Finance]
   *     summary: Get account by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Account details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Account'
   *       404:
   *         description: Account not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/accounts/:id',
    authenticate,
    requirePermission('finance:accounts:read'),
    accountController.getById,
  );

  /**
   * @swagger
   * /v1/finance/accounts/{id}:
   *   patch:
   *     tags: [Finance]
   *     summary: Update account details
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAccountRequest'
   *     responses:
   *       200:
   *         description: Account updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Account'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Account not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.patch(
    '/accounts/:id',
    authenticate,
    requirePermission('finance:accounts:write'),
    validate(UpdateAccountSchema),
    accountController.update,
  );

  /**
   * @swagger
   * /v1/finance/accounts/{id}:
   *   delete:
   *     tags: [Finance]
   *     summary: Delete account (soft delete)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Account deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       404:
   *         description: Account not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Cannot delete account with journal entries
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete(
    '/accounts/:id',
    authenticate,
    requirePermission('finance:accounts:delete'),
    accountController.delete,
  );

  // ─── Journal Entry Routes ─────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/finance/journal-entries:
   *   post:
   *     tags: [Finance]
   *     summary: Create a new journal entry
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateJournalEntryRequest'
   *     responses:
   *       201:
   *         description: Journal entry created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/JournalEntry'
   *       400:
   *         description: Validation error or unbalanced entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/journal-entries',
    authenticate,
    requirePermission('finance:journal-entries:write'),
    validate(CreateJournalEntrySchema),
    journalEntryController.create,
  );

  /**
   * @swagger
   * /v1/finance/journal-entries:
   *   get:
   *     tags: [Finance]
   *     summary: List journal entries with pagination and filters
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [DRAFT, POSTED, REVERSED] }
   *       - in: query
   *         name: dateFrom
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: dateTo
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: accountId
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Paginated list of journal entries
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/JournalEntry'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   */
  router.get(
    '/journal-entries',
    authenticate,
    requirePermission('finance:journal-entries:read'),
    validate(ListJournalEntriesSchema),
    journalEntryController.list,
  );

  /**
   * @swagger
   * /v1/finance/journal-entries/{id}:
   *   get:
   *     tags: [Finance]
   *     summary: Get journal entry by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Journal entry details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/JournalEntry'
   *       404:
   *         description: Journal entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/journal-entries/:id',
    authenticate,
    requirePermission('finance:journal-entries:read'),
    journalEntryController.getById,
  );

  /**
   * @swagger
   * /v1/finance/journal-entries/{id}:
   *   patch:
   *     tags: [Finance]
   *     summary: Update journal entry description only
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [description]
   *             properties:
   *               description:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 500
   *     responses:
   *       200:
   *         description: Journal entry updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/JournalEntry'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Journal entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.patch(
    '/journal-entries/:id',
    authenticate,
    requirePermission('finance:journal-entries:write'),
    validate(UpdateJournalEntrySchema),
    journalEntryController.update,
  );

  /**
   * @swagger
   * /v1/finance/journal-entries/{id}/post:
   *   post:
   *     tags: [Finance]
   *     summary: Post a journal entry
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Journal entry posted successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/JournalEntry'
   *       404:
   *         description: Journal entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Journal entry already posted
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/journal-entries/:id/post',
    authenticate,
    requirePermission('finance:journal-entries:write'),
    journalEntryController.post,
  );

  /**
   * @swagger
   * /v1/finance/journal-entries/{id}/reverse:
   *   post:
   *     tags: [Finance]
   *     summary: Reverse a posted journal entry
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [reason]
   *             properties:
   *               reason:
   *                 type: string
   *                 maxLength: 500
   *     responses:
   *       201:
   *         description: Journal entry reversed successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/JournalEntry'
   *       400:
   *         description: Cannot reverse unposted entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Journal entry not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Journal entry already reversed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/journal-entries/:id/reverse',
    authenticate,
    requirePermission('finance:journal-entries:write'),
    validate(ReverseJournalEntrySchema),
    journalEntryController.reverse,
  );

  // ─── Invoice Routes ───────────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/finance/invoices:
   *   post:
   *     tags: [Finance]
   *     summary: Create a new invoice (AR/AP)
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateInvoiceRequest'
   *     responses:
   *       201:
   *         description: Invoice created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Invoice'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/invoices',
    authenticate,
    requirePermission('finance:invoices:write'),
    validate(CreateInvoiceSchema),
    invoiceController.create,
  );

  /**
   * @swagger
   * /v1/finance/invoices:
   *   get:
   *     tags: [Finance]
   *     summary: List invoices with pagination and filters
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: type
   *         schema: { type: string, enum: [RECEIVABLE, PAYABLE] }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [DRAFT, PENDING, PAID, OVERDUE, CANCELLED] }
   *       - in: query
   *         name: customerId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: dateFrom
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: dateTo
   *         schema: { type: string, format: date }
   *     responses:
   *       200:
   *         description: Paginated list of invoices
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Invoice'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   */
  router.get(
    '/invoices',
    authenticate,
    requirePermission('finance:invoices:read'),
    validate(ListInvoicesSchema),
    invoiceController.list,
  );

  /**
   * @swagger
   * /v1/finance/invoices/{id}:
   *   get:
   *     tags: [Finance]
   *     summary: Get invoice by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Invoice details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Invoice'
   *       404:
   *         description: Invoice not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/invoices/:id',
    authenticate,
    requirePermission('finance:invoices:read'),
    invoiceController.getById,
  );

  /**
   * @swagger
   * /v1/finance/invoices/{id}:
   *   patch:
   *     tags: [Finance]
   *     summary: Update invoice (only DRAFT status)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateInvoiceRequest'
   *     responses:
   *       200:
   *         description: Invoice updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Invoice'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Invoice is not in DRAFT status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.patch(
    '/invoices/:id',
    authenticate,
    requirePermission('finance:invoices:write'),
    validate(UpdateInvoiceSchema),
    invoiceController.update,
  );

  /**
   * @swagger
   * /v1/finance/invoices/{id}/validate:
   *   post:
   *     tags: [Finance]
   *     summary: Validate invoice (DRAFT → PENDING)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Invoice validated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Invoice'
   *       409:
   *         description: Invoice is already pending
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/invoices/:id/validate',
    authenticate,
    requirePermission('finance:invoices:write'),
    invoiceController.validate,
  );

  /**
   * @swagger
   * /v1/finance/invoices/{id}/status:
   *   patch:
   *     tags: [Finance]
   *     summary: Change invoice status
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [status]
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [DRAFT, PENDING, PAID, CANCELLED]
   *     responses:
   *       200:
   *         description: Invoice status changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Invoice'
   *       400:
   *         description: Invalid status transition
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Invoice not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.patch(
    '/invoices/:id/status',
    authenticate,
    requirePermission('finance:invoices:write'),
    validate(ChangeInvoiceStatusSchema),
    invoiceController.changeStatus,
  );

  /**
   * @swagger
   * /v1/finance/invoices/{id}/payments:
   *   post:
   *     tags: [Finance]
   *     summary: Record payment for invoice
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RecordPaymentRequest'
   *     responses:
   *       201:
   *         description: Payment recorded successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Payment'
   *       400:
   *         description: Overpayment or invalid amount
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Invoice not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/invoices/:id/payments',
    authenticate,
    requirePermission('finance:invoices:write'),
    validate(RecordPaymentSchema),
    invoiceController.recordPayment,
  );

  /**
   * @swagger
   * /v1/finance/invoices/{id}/payments:
   *   get:
   *     tags: [Finance]
   *     summary: List invoice payments
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: List of payments
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Payment'
   *       404:
   *         description: Invoice not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/invoices/:id/payments',
    authenticate,
    requirePermission('finance:invoices:read'),
    invoiceController.getPayments,
  );

  // ─── Report Routes ────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/finance/reports/balance-sheet:
   *   get:
   *     tags: [Finance]
   *     summary: Generate balance sheet as of date
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: asOfDate
   *         schema: { type: string, format: date }
   *         description: Defaults to today
   *     responses:
   *       200:
   *         description: Balance sheet report
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BalanceSheetReport'
   */
  router.get(
    '/reports/balance-sheet',
    authenticate,
    requirePermission('finance:reports:read'),
    validate(BalanceSheetQuerySchema),
    reportController.balanceSheet,
  );

  /**
   * @swagger
   * /v1/finance/reports/income-statement:
   *   get:
   *     tags: [Finance]
   *     summary: Generate income statement (P&L) for period
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: compareToPeriod
   *         schema: { type: boolean }
   *         description: Compare with previous period
   *     responses:
   *       200:
   *         description: Income statement report
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/IncomeStatementReport'
   */
  router.get(
    '/reports/income-statement',
    authenticate,
    requirePermission('finance:reports:read'),
    validate(IncomeStatementQuerySchema),
    reportController.incomeStatement,
  );

  /**
   * @swagger
   * /v1/finance/reports/cash-flow:
   *   get:
   *     tags: [Finance]
   *     summary: Generate cash flow statement for period
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema: { type: string, format: date }
   *     responses:
   *       200:
   *         description: Cash flow statement report
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/CashFlowReport'
   */
  router.get(
    '/reports/cash-flow',
    authenticate,
    requirePermission('finance:reports:read'),
    validate(CashFlowQuerySchema),
    reportController.cashFlow,
  );

  return router;
}
