import { Router, RequestHandler } from 'express';
import { validate } from '@erp/core/http';
import { EmployeeController } from './EmployeeController';
import { LeaveController } from './LeaveController';
import { LeaveTypeController } from './LeaveTypeController';
import { DepartmentController } from './DepartmentController';
import { CreateEmployeeSchema } from '../../application/dtos/employee/CreateEmployeeDTO';
import { UpdateEmployeeSchema } from '../../application/dtos/employee/UpdateEmployeeDTO';
import { ListEmployeesSchema } from '../../application/dtos/employee/ListEmployeesDTO';
import { ApplyLeaveSchema } from '../../application/dtos/leave/ApplyLeaveDTO';
import { ReviewLeaveSchema } from '../../application/dtos/leave/ReviewLeaveDTO';
import { ListLeavesSchema } from '../../application/dtos/leave/ListLeavesDTO';
import { CreateLeaveTypeSchema } from '../../application/dtos/leave-type/CreateLeaveTypeDTO';
import { CreateDepartmentSchema } from '../../application/dtos/department/CreateDepartmentDTO';
import { UpdateDepartmentSchema } from '../../application/dtos/department/UpdateDepartmentDTO';
import { ListDepartmentsSchema } from '../../application/dtos/department/ListDepartmentsDTO';

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

  return router;
}
