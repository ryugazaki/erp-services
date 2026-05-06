import 'reflect-metadata';
import { Router } from 'express';
import { Kysely } from 'kysely';
import { container, injectable } from 'tsyringe';
import { IModule, EventHandlerMap } from '@erp/core/module-registry';
import { IEventBus } from '@erp/core/event-bus';
import { AUTH_TOKENS, createAuthMiddleware, requirePermission, ITokenService } from '@erp/module/auth';
import { TOKENS } from './application/tokens';
import { IEmployeeRepository } from './domain/repositories/IEmployeeRepository';
import { ILeaveTypeRepository } from './domain/repositories/ILeaveTypeRepository';
import { ILeaveBalanceRepository } from './domain/repositories/ILeaveBalanceRepository';
import { ILeaveRepository } from './domain/repositories/ILeaveRepository';
import { IEmployeeNumberGenerator } from './application/ports/IEmployeeNumberGenerator';
import { KyselyEmployeeRepository } from './infrastructure/repositories/KyselyEmployeeRepository';
import { KyselyLeaveTypeRepository } from './infrastructure/repositories/KyselyLeaveTypeRepository';
import { KyselyLeaveBalanceRepository } from './infrastructure/repositories/KyselyLeaveBalanceRepository';
import { KyselyLeaveRepository } from './infrastructure/repositories/KyselyLeaveRepository';
import { SequentialEmployeeNumberGenerator } from './infrastructure/services/SequentialEmployeeNumberGenerator';
import { CreateEmployeeUseCase } from './application/use-cases/employee/CreateEmployeeUseCase';
import { GetEmployeeUseCase } from './application/use-cases/employee/GetEmployeeUseCase';
import { ListEmployeesUseCase } from './application/use-cases/employee/ListEmployeesUseCase';
import { UpdateEmployeeUseCase } from './application/use-cases/employee/UpdateEmployeeUseCase';
import { ApplyLeaveUseCase } from './application/use-cases/leave/ApplyLeaveUseCase';
import { ApproveLeaveUseCase } from './application/use-cases/leave/ApproveLeaveUseCase';
import { RejectLeaveUseCase } from './application/use-cases/leave/RejectLeaveUseCase';
import { CancelLeaveUseCase } from './application/use-cases/leave/CancelLeaveUseCase';
import { ListLeavesUseCase } from './application/use-cases/leave/ListLeavesUseCase';
import { CreateLeaveTypeUseCase } from './application/use-cases/leave-type/CreateLeaveTypeUseCase';
import { ListLeaveTypesUseCase } from './application/use-cases/leave-type/ListLeaveTypesUseCase';
import { EmployeeController } from './infrastructure/http/EmployeeController';
import { LeaveController } from './infrastructure/http/LeaveController';
import { LeaveTypeController } from './infrastructure/http/LeaveTypeController';
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
    container.registerInstance(TOKENS.EmployeeNumberGenerator, new SequentialEmployeeNumberGenerator(this.config.db));
    container.registerInstance(TOKENS.EventBus, this.config.eventBus);
  }

  async bootstrap(): Promise<void> {
    const employeeRepo = container.resolve<IEmployeeRepository>(TOKENS.EmployeeRepository);
    const leaveTypeRepo = container.resolve<ILeaveTypeRepository>(TOKENS.LeaveTypeRepository);
    const leaveBalanceRepo = container.resolve<ILeaveBalanceRepository>(TOKENS.LeaveBalanceRepository);
    const leaveRepo = container.resolve<ILeaveRepository>(TOKENS.LeaveRepository);
    const empNumGenerator = container.resolve<IEmployeeNumberGenerator>(TOKENS.EmployeeNumberGenerator);
    const eventBus = container.resolve<IEventBus>(TOKENS.EventBus);

    const tokenService = container.resolve<ITokenService>(AUTH_TOKENS.TokenService);

    const createEmployeeUseCase = new CreateEmployeeUseCase(employeeRepo, empNumGenerator, eventBus);
    const getEmployeeUseCase = new GetEmployeeUseCase(employeeRepo);
    const listEmployeesUseCase = new ListEmployeesUseCase(employeeRepo);
    const updateEmployeeUseCase = new UpdateEmployeeUseCase(employeeRepo, eventBus);

    const applyLeaveUseCase = new ApplyLeaveUseCase(employeeRepo, leaveTypeRepo, leaveBalanceRepo, leaveRepo, eventBus);
    const approveLeaveUseCase = new ApproveLeaveUseCase(leaveRepo, eventBus);
    const rejectLeaveUseCase = new RejectLeaveUseCase(leaveRepo, leaveBalanceRepo, eventBus);
    const cancelLeaveUseCase = new CancelLeaveUseCase(leaveRepo, leaveBalanceRepo, eventBus);
    const listLeavesUseCase = new ListLeavesUseCase(leaveRepo);

    const createLeaveTypeUseCase = new CreateLeaveTypeUseCase(leaveTypeRepo);
    const listLeaveTypesUseCase = new ListLeaveTypesUseCase(leaveTypeRepo);

    const employeeController = new EmployeeController(createEmployeeUseCase, getEmployeeUseCase, listEmployeesUseCase, updateEmployeeUseCase);
    const leaveController = new LeaveController(applyLeaveUseCase, approveLeaveUseCase, rejectLeaveUseCase, cancelLeaveUseCase, listLeavesUseCase);
    const leaveTypeController = new LeaveTypeController(createLeaveTypeUseCase, listLeaveTypesUseCase);

    const authenticate = createAuthMiddleware(tokenService);

    this.router = createHrRoutes(
      employeeController,
      leaveController,
      leaveTypeController,
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
