import { ColumnType } from 'kysely';

export interface HrDatabase {
  'hr.employees': EmployeesTable;
  'hr.leave_types': LeaveTypesTable;
  'hr.leave_balances': LeaveBalancesTable;
  'hr.leaves': LeavesTable;
  'hr.departments': DepartmentsTable;
  'hr.attendances': AttendancesTable;
}

export interface EmployeesTable {
  id: ColumnType<string, string, string>;
  employee_number: ColumnType<string, string, string>;
  first_name: ColumnType<string, string, string>;
  last_name: ColumnType<string, string, string>;
  email: ColumnType<string, string, string>;
  phone: ColumnType<string | null, string | null, string | null>;
  department_id: ColumnType<string | null, string | null, string | null>;
  position: ColumnType<string | null, string | null, string | null>;
  hire_date: ColumnType<Date, Date, Date>;
  status: ColumnType<string, string, string>;
  user_id: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
  deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export interface LeaveTypesTable {
  id: ColumnType<string, string, string>;
  name: ColumnType<string, string, string>;
  code: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  default_days: ColumnType<number, number, number>;
  is_paid: ColumnType<boolean, boolean, boolean>;
  is_active: ColumnType<boolean, boolean, boolean>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
}

export interface LeaveBalancesTable {
  id: ColumnType<string, string, string>;
  employee_id: ColumnType<string, string, string>;
  leave_type_id: ColumnType<string, string, string>;
  year: ColumnType<number, number, number>;
  total_days: ColumnType<number, number, number>;
  used_days: ColumnType<number, number, number>;
  remaining_days: ColumnType<number, number, number>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
}

export interface LeavesTable {
  id: ColumnType<string, string, string>;
  employee_id: ColumnType<string, string, string>;
  leave_type_id: ColumnType<string, string, string>;
  start_date: ColumnType<Date, Date, Date>;
  end_date: ColumnType<Date, Date, Date>;
  total_days: ColumnType<number, number, number>;
  reason: ColumnType<string | null, string | null, string | null>;
  status: ColumnType<string, string, string>;
  approved_by: ColumnType<string | null, string | null, string | null>;
  approved_at: ColumnType<Date | null, Date | null, Date | null>;
  remarks: ColumnType<string | null, string | null, string | null>;
  cancelled_at: ColumnType<Date | null, Date | null, Date | null>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
}

export interface DepartmentsTable {
  id: ColumnType<string, string, string>;
  name: ColumnType<string, string, string>;
  code: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  head_id: ColumnType<string | null, string | null, string | null>;
  is_active: ColumnType<boolean, boolean, boolean>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
}

export interface AttendancesTable {
  id: ColumnType<string, string, string>;
  employee_id: ColumnType<string, string, string>;
  date: ColumnType<Date, Date, Date>;
  clocked_in_at: ColumnType<Date, Date, Date>;
  clocked_out_at: ColumnType<Date | null, Date | null, Date | null>;
  status: ColumnType<string, string, string>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
}
