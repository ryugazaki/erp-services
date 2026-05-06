interface ErrorMeta {
  status: number;
  message: string;
}

const errorMap: Record<string, ErrorMeta> = {
  // Employee errors
  EMPLOYEE_NOT_FOUND: { status: 404, message: 'Employee not found' },
  EMPLOYEE_EMAIL_EXISTS: { status: 409, message: 'Employee with this email already exists' },
  EMPLOYEE_NOT_ACTIVE: { status: 400, message: 'Employee is not active' },
  FIRST_NAME_REQUIRED: { status: 400, message: 'First name is required' },
  LAST_NAME_REQUIRED: { status: 400, message: 'Last name is required' },
  HIRE_DATE_REQUIRED: { status: 400, message: 'Hire date is required' },
  INVALID_EMPLOYEE_STATUS: { status: 400, message: 'Invalid employee status' },

  // Leave errors
  LEAVE_NOT_FOUND: { status: 404, message: 'Leave not found' },
  LEAVE_ALREADY_PROCESSED: { status: 409, message: 'Leave has already been processed' },
  LEAVE_CANNOT_CANCEL: { status: 409, message: 'Leave cannot be cancelled' },

  // Leave type errors
  LEAVE_TYPE_NOT_FOUND: { status: 404, message: 'Leave type not found' },
  LEAVE_TYPE_CODE_EXISTS: { status: 409, message: 'Leave type code already exists' },
  LEAVE_TYPE_NAME_REQUIRED: { status: 400, message: 'Leave type name is required' },
  LEAVE_TYPE_CODE_REQUIRED: { status: 400, message: 'Leave type code is required' },
  LEAVE_TYPE_INVALID_DAYS: { status: 400, message: 'Invalid default days' },
  LEAVE_TYPE_ALREADY_ACTIVE: { status: 409, message: 'Leave type is already active' },
  LEAVE_TYPE_ALREADY_INACTIVE: { status: 409, message: 'Leave type is already inactive' },

  // Leave balance errors
  INSUFFICIENT_LEAVE_BALANCE: { status: 400, message: 'Insufficient leave balance' },
  LEAVE_BALANCE_INVALID_DAYS: { status: 400, message: 'Invalid leave balance days' },

  // General validation errors
  INVALID_DATE_RANGE: { status: 400, message: 'Invalid date range' },

  // Attendance errors
  ATTENDANCE_NOT_FOUND: { status: 404, message: 'Attendance record not found' },
  ATTENDANCE_ALREADY_CLOCKED_IN: { status: 409, message: 'Employee already clocked in today' },
  ATTENDANCE_ALREADY_CLOCKED_OUT: { status: 409, message: 'Employee already clocked out' },
  ATTENDANCE_NOT_CLOCKED_IN: { status: 400, message: 'Employee has not clocked in today' },
};

export function mapHrError(code: string): ErrorMeta {
  return errorMap[code] ?? { status: 500, message: 'An unexpected error occurred' };
}
