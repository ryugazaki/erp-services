import { Router, RequestHandler } from 'express';
import { validate } from '@erp/core/http';
import { EmployeeController } from './EmployeeController';
import { LeaveController } from './LeaveController';
import { LeaveTypeController } from './LeaveTypeController';
import { DepartmentController } from './DepartmentController';
import { AttendanceController } from './AttendanceController';
import { CreateEmployeeSchema } from '../../application/dtos/employee/CreateEmployeeDTO';
import { UpdateEmployeeSchema } from '../../application/dtos/employee/UpdateEmployeeDTO';
import { ChangeEmployeeStatusSchema } from '../../application/dtos/employee/ChangeEmployeeStatusDTO';
import { ListEmployeesSchema } from '../../application/dtos/employee/ListEmployeesDTO';
import { ApplyLeaveSchema } from '../../application/dtos/leave/ApplyLeaveDTO';
import { ReviewLeaveSchema } from '../../application/dtos/leave/ReviewLeaveDTO';
import { ListLeavesSchema } from '../../application/dtos/leave/ListLeavesDTO';
import { CreateLeaveTypeSchema } from '../../application/dtos/leave-type/CreateLeaveTypeDTO';
import { UpdateLeaveTypeSchema } from '../../application/dtos/leave-type/UpdateLeaveTypeDTO';
import { CreateDepartmentSchema } from '../../application/dtos/department/CreateDepartmentDTO';
import { UpdateDepartmentSchema } from '../../application/dtos/department/UpdateDepartmentDTO';
import { ListDepartmentsSchema } from '../../application/dtos/department/ListDepartmentsDTO';
import { ClockInSchema } from '../../application/dtos/attendance/ClockInDTO';
import { ClockOutSchema } from '../../application/dtos/attendance/ClockOutDTO';
import { ListAttendancesSchema } from '../../application/dtos/attendance/ListAttendancesDTO';
import { AttendanceSummarySchema } from '../../application/dtos/attendance/AttendanceSummaryDTO';

/**
 * @swagger
 * tags:
 *   - name: HR
 *     description: Human Resources — employees, departments, leaves, and leave types
 */

export function createHrRoutes(
  employeeController: EmployeeController,
  leaveController: LeaveController,
  leaveTypeController: LeaveTypeController,
  departmentController: DepartmentController,
  attendanceController: AttendanceController,
  authenticate: RequestHandler,
  requirePermission: (...permissions: string[]) => RequestHandler,
): Router {
  const router = Router();

  // ─── Employee Routes ──────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/hr/employees:
   *   post:
   *     tags: [HR]
   *     summary: Create a new employee
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateEmployeeRequest'
   *     responses:
   *       201:
   *         description: Employee created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Employee'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Duplicate email
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/employees',
    authenticate,
    requirePermission('hr:employees:write'),
    validate(CreateEmployeeSchema),
    employeeController.create,
  );

  /**
   * @swagger
   * /v1/hr/employees:
   *   get:
   *     tags: [HR]
   *     summary: List employees with pagination and filters
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
   *         schema: { type: string, enum: [ACTIVE, INACTIVE, RESIGNED] }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Paginated list of employees
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
   *                         $ref: '#/components/schemas/Employee'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   */
  router.get(
    '/employees',
    authenticate,
    requirePermission('hr:employees:read'),
    validate(ListEmployeesSchema),
    employeeController.list,
  );

  /**
   * @swagger
   * /v1/hr/employees/{id}:
   *   get:
   *     tags: [HR]
   *     summary: Get employee by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Employee details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Employee'
   *       404:
   *         description: Employee not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/employees/:id',
    authenticate,
    requirePermission('hr:employees:read'),
    employeeController.getById,
  );

  /**
   * @swagger
   * /v1/hr/employees/{id}:
   *   put:
   *     tags: [HR]
   *     summary: Update employee details
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
   *             $ref: '#/components/schemas/UpdateEmployeeRequest'
   *     responses:
   *       200:
   *         description: Employee updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Employee'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Employee not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/employees/:id',
    authenticate,
    requirePermission('hr:employees:write'),
    validate(UpdateEmployeeSchema),
    employeeController.update,
  );

  /**
   * @swagger
   * /v1/hr/employees/{id}/status:
   *   put:
   *     tags: [HR]
   *     summary: Change employee status
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
   *                 enum: [ACTIVE, INACTIVE, SUSPENDED, TERMINATED]
   *     responses:
   *       200:
   *         description: Employee status changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Employee'
   *       400:
   *         description: Invalid status value
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Employee not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/employees/:id/status',
    authenticate,
    requirePermission('hr:employees:write'),
    validate(ChangeEmployeeStatusSchema),
    employeeController.changeStatus,
  );

  // ─── Leave Routes ─────────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/hr/leaves/{id}:
   *   get:
   *     tags: [HR]
   *     summary: Get leave by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Leave details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Leave'
   *       404:
   *         description: Leave not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/leaves/:id',
    authenticate,
    requirePermission('hr:leaves:read'),
    leaveController.getById,
  );

  /**
   * @swagger
   * /v1/hr/leaves:
   *   post:
   *     tags: [HR]
   *     summary: Apply for leave
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ApplyLeaveRequest'
   *     responses:
   *       201:
   *         description: Leave application submitted
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Leave'
   *       400:
   *         description: Validation error or insufficient balance
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/leaves',
    authenticate,
    requirePermission('hr:leaves:write'),
    validate(ApplyLeaveSchema),
    leaveController.apply,
  );

  /**
   * @swagger
   * /v1/hr/leaves:
   *   get:
   *     tags: [HR]
   *     summary: List leaves with pagination and filters
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: employeeId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED, CANCELLED] }
   *       - in: query
   *         name: startDateFrom
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: startDateTo
   *         schema: { type: string, format: date }
   *     responses:
   *       200:
   *         description: Paginated list of leaves
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
   *                         $ref: '#/components/schemas/Leave'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   */
  router.get(
    '/leaves',
    authenticate,
    requirePermission('hr:leaves:read'),
    validate(ListLeavesSchema),
    leaveController.list,
  );

  /**
   * @swagger
   * /v1/hr/leaves/{id}/approve:
   *   put:
   *     tags: [HR]
   *     summary: Approve a leave application
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ReviewLeaveRequest'
   *     responses:
   *       200:
   *         description: Leave approved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Leave'
   *       404:
   *         description: Leave not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Leave already processed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/leaves/:id/approve',
    authenticate,
    requirePermission('hr:leaves:approve'),
    validate(ReviewLeaveSchema),
    leaveController.approve,
  );

  /**
   * @swagger
   * /v1/hr/leaves/{id}/reject:
   *   put:
   *     tags: [HR]
   *     summary: Reject a leave application
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ReviewLeaveRequest'
   *     responses:
   *       200:
   *         description: Leave rejected successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Leave'
   *       404:
   *         description: Leave not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Leave already processed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/leaves/:id/reject',
    authenticate,
    requirePermission('hr:leaves:approve'),
    validate(ReviewLeaveSchema),
    leaveController.reject,
  );

  /**
   * @swagger
   * /v1/hr/leaves/{id}/cancel:
   *   put:
   *     tags: [HR]
   *     summary: Cancel a leave application
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Leave cancelled successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Leave'
   *       404:
   *         description: Leave not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Leave cannot be cancelled
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/leaves/:id/cancel',
    authenticate,
    requirePermission('hr:leaves:write'),
    leaveController.cancel,
  );

  // ─── Leave Balance Routes ──────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/hr/employees/{employeeId}/leave-balances:
   *   get:
   *     tags: [HR]
   *     summary: Get leave balances for an employee
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: employeeId
   *         required: true
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: year
   *         schema: { type: integer, example: 2026 }
   *         description: Defaults to current year
   *     responses:
   *       200:
   *         description: List of leave balances
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
   *                         $ref: '#/components/schemas/LeaveBalance'
   *       404:
   *         description: Employee not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/employees/:employeeId/leave-balances',
    authenticate,
    requirePermission('hr:leaves:read'),
    leaveController.getBalances,
  );

  // ─── Department Routes ────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/hr/departments:
   *   post:
   *     tags: [HR]
   *     summary: Create a new department
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateDepartmentRequest'
   *     responses:
   *       201:
   *         description: Department created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Department'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Duplicate department code
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/departments',
    authenticate,
    requirePermission('hr:departments:write'),
    validate(CreateDepartmentSchema),
    departmentController.create,
  );

  /**
   * @swagger
   * /v1/hr/departments:
   *   get:
   *     tags: [HR]
   *     summary: List departments with pagination and filters
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   *     responses:
   *       200:
   *         description: Paginated list of departments
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
   *                         $ref: '#/components/schemas/Department'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   */
  router.get(
    '/departments',
    authenticate,
    requirePermission('hr:departments:read'),
    validate(ListDepartmentsSchema),
    departmentController.list,
  );

  /**
   * @swagger
   * /v1/hr/departments/{id}:
   *   get:
   *     tags: [HR]
   *     summary: Get department by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Department details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Department'
   *       404:
   *         description: Department not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/departments/:id',
    authenticate,
    requirePermission('hr:departments:read'),
    departmentController.getById,
  );

  /**
   * @swagger
   * /v1/hr/departments/{id}:
   *   put:
   *     tags: [HR]
   *     summary: Update department details
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
   *             $ref: '#/components/schemas/UpdateDepartmentRequest'
   *     responses:
   *       200:
   *         description: Department updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Department'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Department not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/departments/:id',
    authenticate,
    requirePermission('hr:departments:write'),
    validate(UpdateDepartmentSchema),
    departmentController.update,
  );

  /**
   * @swagger
   * /v1/hr/departments/{id}/activate:
   *   put:
   *     tags: [HR]
   *     summary: Activate a department
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Department activated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Department'
   *       404:
   *         description: Department not found
   *       409:
   *         description: Department already active
   */
  router.put(
    '/departments/:id/activate',
    authenticate,
    requirePermission('hr:departments:write'),
    departmentController.activate,
  );

  /**
   * @swagger
   * /v1/hr/departments/{id}/deactivate:
   *   put:
   *     tags: [HR]
   *     summary: Deactivate a department
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Department deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Department'
   *       404:
   *         description: Department not found
   *       409:
   *         description: Department already inactive
   */
  router.put(
    '/departments/:id/deactivate',
    authenticate,
    requirePermission('hr:departments:write'),
    departmentController.deactivate,
  );

  // ─── Leave Type Routes ────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/hr/leave-types:
   *   post:
   *     tags: [HR]
   *     summary: Create a new leave type
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateLeaveTypeRequest'
   *     responses:
   *       201:
   *         description: Leave type created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/LeaveType'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Duplicate leave type code
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/leave-types',
    authenticate,
    requirePermission('hr:leave-types:write'),
    validate(CreateLeaveTypeSchema),
    leaveTypeController.create,
  );

  /**
   * @swagger
   * /v1/hr/leave-types:
   *   get:
   *     tags: [HR]
   *     summary: List all leave types
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: List of leave types
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
   *                         $ref: '#/components/schemas/LeaveType'
   */
  router.get(
    '/leave-types',
    authenticate,
    requirePermission('hr:leave-types:read'),
    leaveTypeController.list,
  );

  /**
   * @swagger
   * /v1/hr/leave-types/{id}:
   *   put:
   *     tags: [HR]
   *     summary: Update a leave type
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
   *             $ref: '#/components/schemas/UpdateLeaveTypeRequest'
   *     responses:
   *       200:
   *         description: Leave type updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/LeaveType'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Leave type not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/leave-types/:id',
    authenticate,
    requirePermission('hr:leave-types:write'),
    validate(UpdateLeaveTypeSchema),
    leaveTypeController.update,
  );

  /**
   * @swagger
   * /v1/hr/leave-types/{id}/activate:
   *   put:
   *     tags: [HR]
   *     summary: Activate a leave type
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Leave type activated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/LeaveType'
   *       404:
   *         description: Leave type not found
   *       409:
   *         description: Leave type already active
   */
  router.put(
    '/leave-types/:id/activate',
    authenticate,
    requirePermission('hr:leave-types:write'),
    leaveTypeController.activate,
  );

  /**
   * @swagger
   * /v1/hr/leave-types/{id}/deactivate:
   *   put:
   *     tags: [HR]
   *     summary: Deactivate a leave type
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Leave type deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/LeaveType'
   *       404:
   *         description: Leave type not found
   *       409:
   *         description: Leave type already inactive
   */
  router.put(
    '/leave-types/:id/deactivate',
    authenticate,
    requirePermission('hr:leave-types:write'),
    leaveTypeController.deactivate,
  );

  // ─── Attendance Routes ─────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/hr/attendances/clock-in:
   *   post:
   *     tags: [HR]
   *     summary: Clock in for today
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [employeeId]
   *             properties:
   *               employeeId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Clocked in successfully
   *       409:
   *         description: Already clocked in today
   */
  router.post(
    '/attendances/clock-in',
    authenticate,
    requirePermission('hr:attendances:write'),
    validate(ClockInSchema),
    attendanceController.clockIn,
  );

  /**
   * @swagger
   * /v1/hr/attendances/clock-out:
   *   post:
   *     tags: [HR]
   *     summary: Clock out for today
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [employeeId]
   *             properties:
   *               employeeId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       200:
   *         description: Clocked out successfully
   *       400:
   *         description: Not clocked in today
   *       409:
   *         description: Already clocked out
   */
  router.post(
    '/attendances/clock-out',
    authenticate,
    requirePermission('hr:attendances:write'),
    validate(ClockOutSchema),
    attendanceController.clockOut,
  );

  /**
   * @swagger
   * /v1/hr/attendances/summary:
   *   get:
   *     tags: [HR]
   *     summary: Get monthly attendance summary
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: employeeId
   *         required: true
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: month
   *         required: true
   *         schema: { type: integer, minimum: 1, maximum: 12 }
   *       - in: query
   *         name: year
   *         required: true
   *         schema: { type: integer, minimum: 2020 }
   *     responses:
   *       200:
   *         description: Monthly attendance summary
   */
  router.get(
    '/attendances/summary',
    authenticate,
    requirePermission('hr:attendances:read'),
    validate(AttendanceSummarySchema),
    attendanceController.getSummary,
  );

  /**
   * @swagger
   * /v1/hr/attendances:
   *   get:
   *     tags: [HR]
   *     summary: List attendance records
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: employeeId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [CLOCKED_IN, CLOCKED_OUT, ABSENT] }
   *       - in: query
   *         name: dateFrom
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: dateTo
   *         schema: { type: string, format: date }
   *     responses:
   *       200:
   *         description: Paginated list of attendance records
   */
  router.get(
    '/attendances',
    authenticate,
    requirePermission('hr:attendances:read'),
    validate(ListAttendancesSchema),
    attendanceController.list,
  );

  /**
   * @swagger
   * /v1/hr/attendances/{id}:
   *   get:
   *     tags: [HR]
   *     summary: Get attendance by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Attendance record details
   *       404:
   *         description: Attendance not found
   */
  router.get(
    '/attendances/:id',
    authenticate,
    requirePermission('hr:attendances:read'),
    attendanceController.getById,
  );

  return router;
}
