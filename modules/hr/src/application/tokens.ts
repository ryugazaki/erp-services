export const TOKENS = {
  EmployeeRepository: Symbol('IEmployeeRepository'),
  LeaveTypeRepository: Symbol('ILeaveTypeRepository'),
  LeaveBalanceRepository: Symbol('ILeaveBalanceRepository'),
  LeaveRepository: Symbol('ILeaveRepository'),
  EmployeeNumberGenerator: Symbol('IEmployeeNumberGenerator'),
  UserAccountCreator: Symbol('IUserAccountCreator'),
  EventBus: Symbol('IEventBus'),
} as const;
