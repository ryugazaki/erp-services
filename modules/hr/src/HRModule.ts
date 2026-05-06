import 'reflect-metadata';
import { Router } from 'express';
import { Kysely } from 'kysely';
import { container, injectable } from 'tsyringe';
import { IModule, EventHandlerMap } from '@erp/core/module-registry';
import { IEventBus } from '@erp/core/event-bus';
import { AUTH_TOKENS, createAuthMiddleware, requirePermission, ITokenService, UserAccountCreator } from '@erp/module/auth';
import { TOKENS } from './application/tokens';
import { IEmployeeRepository } from './domain/repositories/IEmployeeRepository';
import { ILeaveTypeRepository } from './domain/repositories/ILeaveTypeRepository';
import { ILeaveBalanceRepository } from './domain/repositories/ILeaveBalanceRepository';
import { ILeaveRepository } from './domain/repositories/ILeaveRepository';
import { IDepartmentRepository } from './domain/repositories/IDepartmentRepository';
import { IAttendanceRepository } from './domain/repositories/IAttendanceRepository';
import { IEmployeeNumberGenerator } from './application/ports/IEmployeeNumberGenerator';
import { IUserAccountCreator } from './application/ports/IUserAccountCreator';
import { KyselyEmployeeRepository } from './infrastructure/repositories/KyselyEmployeeRepository';
import { KyselyLeaveTypeRepository } from './infrastructure/repositories/KyselyLeaveTypeRepository';
import { KyselyLeaveBalanceRepository } from './infrastructure/repositories/KyselyLeaveBalanceRepository';
import { KyselyLeaveRepository } from './infrastructure/repositories/KyselyLeaveRepository';
import { KyselyDepartmentRepository } from './infrastructure/repositories/KyselyDepartmentRepository';
import { KyselyAttendanceRepository } from './infrastructure/repositories/KyselyAttendanceRepository';
import { SequentialEmployeeNumberGenerator } from './infrastructure/services/SequentialEmployeeNumberGenerator';
import { CreateEmployeeUseCase } from './application/use-cases/employee/CreateEmployeeUseCase';
import { GetEmployeeUseCase } from './application/use-cases/employee/GetEmployeeUseCase';
import { ListEmployeesUseCase } from './application/use-cases/employee/ListEmployeesUseCase';
import { UpdateEmployeeUseCase } from './application/use-cases/employee/UpdateEmployeeUseCase';
import { ChangeEmployeeStatusUseCase } from './application/use-cases/employee/ChangeEmployeeStatusUseCase';
import { ApplyLeaveUseCase } from './application/use-cases/leave/ApplyLeaveUseCase';
import { ApproveLeaveUseCase } from './application/use-cases/leave/ApproveLeaveUseCase';
import { RejectLeaveUseCase } from './application/use-cases/leave/RejectLeaveUseCase';
import { CancelLeaveUseCase } from './application/use-cases/leave/CancelLeaveUseCase';
import { ListLeavesUseCase } from './application/use-cases/leave/ListLeavesUseCase';
import { GetLeaveUseCase } from './application/use-cases/leave/GetLeaveUseCase';
import { GetEmployeeLeaveBalancesUseCase } from './application/use-cases/leave-balance/GetEmployeeLeaveBalancesUseCase';
import { CreateLeaveTypeUseCase } from './application/use-cases/leave-type/CreateLeaveTypeUseCase';
import { ListLeaveTypesUseCase } from './application/use-cases/leave-type/ListLeaveTypesUseCase';
import { UpdateLeaveTypeUseCase } from './application/use-cases/leave-type/UpdateLeaveTypeUseCase';
import { ChangeLeaveTypeStatusUseCase } from './application/use-cases/leave-type/ChangeLeaveTypeStatusUseCase';
import { CreateDepartmentUseCase } from './application/use-cases/department/CreateDepartmentUseCase';
import { GetDepartmentUseCase } from './application/use-cases/department/GetDepartmentUseCase';
import { ListDepartmentsUseCase } from './application/use-cases/department/ListDepartmentsUseCase';
import { UpdateDepartmentUseCase } from './application/use-cases/department/UpdateDepartmentUseCase';
import { ChangeDepartmentStatusUseCase } from './application/use-cases/department/ChangeDepartmentStatusUseCase';
import { ClockInUseCase } from './application/use-cases/attendance/ClockInUseCase';
import { ClockOutUseCase } from './application/use-cases/attendance/ClockOutUseCase';
import { GetAttendanceUseCase } from './application/use-cases/attendance/GetAttendanceUseCase';
import { ListAttendancesUseCase } from './application/use-cases/attendance/ListAttendancesUseCase';
import { GetAttendanceSummaryUseCase } from './application/use-cases/attendance/GetAttendanceSummaryUseCase';
import { EmployeeController } from './infrastructure/http/EmployeeController';
import { LeaveController } from './infrastructure/http/LeaveController';
import { LeaveTypeController } from './infrastructure/http/LeaveTypeController';
import { DepartmentController } from './infrastructure/http/DepartmentController';
import { AttendanceController } from './infrastructure/http/AttendanceController';
import { createHrRoutes } from './infrastructure/http/HrRoutes';

export interface HRModuleConfig {
  db: Kysely<any>;
  eventBus: IEventBus;
}

@injectable()
export class HRModule implements IModule {
  name = 'hr';
  version = '1.0.0';
  dependencies: string[] = ['auth'];

  private router!: Router;
  private config: HRModuleConfig;

  constructor(config: HRModuleConfig) {
    this.config = config;
  }

  async register(_container: any): Promise<void> {
    container.registerInstance(TOKENS.EmployeeRepository, new KyselyEmployeeRepository(this.config.db));
    container.registerInstance(TOKENS.LeaveTypeRepository, new KyselyLeaveTypeRepository(this.config.db));
    container.registerInstance(TOKENS.LeaveBalanceRepository, new KyselyLeaveBalanceRepository(this.config.db));
    container.registerInstance(TOKENS.LeaveRepository, new KyselyLeaveRepository(this.config.db));
    container.registerInstance(TOKENS.DepartmentRepository, new KyselyDepartmentRepository(this.config.db));
    container.registerInstance(TOKENS.AttendanceRepository, new KyselyAttendanceRepository(this.config.db));
    container.registerInstance(TOKENS.EmployeeNumberGenerator, new SequentialEmployeeNumberGenerator(this.config.db));
    container.registerInstance(TOKENS.EventBus, this.config.eventBus);

    const userRepo = container.resolve<any>(AUTH_TOKENS.UserRepository);
    container.registerInstance(TOKENS.UserAccountCreator, new UserAccountCreator(userRepo));
  }

  async bootstrap(): Promise<void> {
    const employeeRepo = container.resolve<IEmployeeRepository>(TOKENS.EmployeeRepository);
    const leaveTypeRepo = container.resolve<ILeaveTypeRepository>(TOKENS.LeaveTypeRepository);
    const leaveBalanceRepo = container.resolve<ILeaveBalanceRepository>(TOKENS.LeaveBalanceRepository);
    const leaveRepo = container.resolve<ILeaveRepository>(TOKENS.LeaveRepository);
    const empNumGenerator = container.resolve<IEmployeeNumberGenerator>(TOKENS.EmployeeNumberGenerator);
    const userAccountCreator = container.resolve<IUserAccountCreator>(TOKENS.UserAccountCreator);
    const eventBus = container.resolve<IEventBus>(TOKENS.EventBus);

    const tokenService = container.resolve<ITokenService>(AUTH_TOKENS.TokenService);

    const createEmployeeUseCase = new CreateEmployeeUseCase(employeeRepo, empNumGenerator, userAccountCreator, eventBus);
    const getEmployeeUseCase = new GetEmployeeUseCase(employeeRepo);
    const listEmployeesUseCase = new ListEmployeesUseCase(employeeRepo);
    const updateEmployeeUseCase = new UpdateEmployeeUseCase(employeeRepo, eventBus);
    const changeEmployeeStatusUseCase = new ChangeEmployeeStatusUseCase(employeeRepo, eventBus);

    const applyLeaveUseCase = new ApplyLeaveUseCase(employeeRepo, leaveTypeRepo, leaveBalanceRepo, leaveRepo, eventBus);
    const approveLeaveUseCase = new ApproveLeaveUseCase(leaveRepo, eventBus);
    const rejectLeaveUseCase = new RejectLeaveUseCase(leaveRepo, leaveBalanceRepo, eventBus);
    const cancelLeaveUseCase = new CancelLeaveUseCase(leaveRepo, leaveBalanceRepo, eventBus);
    const listLeavesUseCase = new ListLeavesUseCase(leaveRepo);
    const getLeaveUseCase = new GetLeaveUseCase(leaveRepo);
    const getEmployeeLeaveBalancesUseCase = new GetEmployeeLeaveBalancesUseCase(leaveBalanceRepo);

    const createLeaveTypeUseCase = new CreateLeaveTypeUseCase(leaveTypeRepo);
    const listLeaveTypesUseCase = new ListLeaveTypesUseCase(leaveTypeRepo);
    const updateLeaveTypeUseCase = new UpdateLeaveTypeUseCase(leaveTypeRepo);
    const changeLeaveTypeStatusUseCase = new ChangeLeaveTypeStatusUseCase(leaveTypeRepo);

    const departmentRepo = container.resolve<IDepartmentRepository>(TOKENS.DepartmentRepository);
    const createDepartmentUseCase = new CreateDepartmentUseCase(departmentRepo, eventBus);
    const getDepartmentUseCase = new GetDepartmentUseCase(departmentRepo);
    const listDepartmentsUseCase = new ListDepartmentsUseCase(departmentRepo);
    const updateDepartmentUseCase = new UpdateDepartmentUseCase(departmentRepo);
    const changeDepartmentStatusUseCase = new ChangeDepartmentStatusUseCase(departmentRepo);

    const attendanceRepo = container.resolve<IAttendanceRepository>(TOKENS.AttendanceRepository);
    const clockInUseCase = new ClockInUseCase(attendanceRepo, employeeRepo, eventBus);
    const clockOutUseCase = new ClockOutUseCase(attendanceRepo, eventBus);
    const getAttendanceUseCase = new GetAttendanceUseCase(attendanceRepo);
    const listAttendancesUseCase = new ListAttendancesUseCase(attendanceRepo);
    const getAttendanceSummaryUseCase = new GetAttendanceSummaryUseCase(attendanceRepo);

    const employeeController = new EmployeeController(createEmployeeUseCase, getEmployeeUseCase, listEmployeesUseCase, updateEmployeeUseCase, changeEmployeeStatusUseCase);
    const leaveController = new LeaveController(applyLeaveUseCase, approveLeaveUseCase, rejectLeaveUseCase, cancelLeaveUseCase, listLeavesUseCase, getLeaveUseCase, getEmployeeLeaveBalancesUseCase);
    const leaveTypeController = new LeaveTypeController(createLeaveTypeUseCase, listLeaveTypesUseCase, updateLeaveTypeUseCase, changeLeaveTypeStatusUseCase);
    const departmentController = new DepartmentController(createDepartmentUseCase, getDepartmentUseCase, listDepartmentsUseCase, updateDepartmentUseCase, changeDepartmentStatusUseCase);
    const attendanceController = new AttendanceController(clockInUseCase, clockOutUseCase, getAttendanceUseCase, listAttendancesUseCase, getAttendanceSummaryUseCase);

    const authenticate = createAuthMiddleware(tokenService);

    this.router = createHrRoutes(
      employeeController,
      leaveController,
      leaveTypeController,
      departmentController,
      attendanceController,
      authenticate,
      requirePermission,
    );
  }

  getRoutes(): Router {
    return this.router;
  }

  getEventHandlers(): EventHandlerMap {
    return {};
  }

  async teardown(): Promise<void> {}
}
