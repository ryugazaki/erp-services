import { Attendance } from '../Attendance';

describe('Attendance', () => {
  it('should create attendance with CLOCKED_IN status', () => {
    const date = new Date(2026, 0, 15);
    const clockedInAt = new Date(2026, 0, 15, 8, 0);

    const result = Attendance.create({
      employeeId: 'emp-1',
      date,
      clockedInAt,
    });

    expect(result.isSuccess()).toBe(true);
    const attendance = result.getValue();
    expect(attendance.status).toBe('CLOCKED_IN');
    expect(attendance.clockedOutAt).toBeNull();
    expect(attendance.employeeId).toBe('emp-1');
    expect(attendance.date).toBe(date);
    expect(attendance.clockedInAt).toBe(clockedInAt);
  });

  it('should fail if employeeId is empty', () => {
    const result = Attendance.create({
      employeeId: '',
      date: new Date(),
      clockedInAt: new Date(),
    });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EMPLOYEE_ID_REQUIRED');
  });

  it('should record clocked-in event on creation', () => {
    const attendance = Attendance.create({
      employeeId: 'emp-1',
      date: new Date(2026, 0, 15),
      clockedInAt: new Date(),
    }).getValue();

    const events = attendance.pullEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('hr.attendance.clocked-in');
  });

  it('should clock out successfully', () => {
    const attendance = Attendance.create({
      employeeId: 'emp-1',
      date: new Date(2026, 0, 15),
      clockedInAt: new Date(2026, 0, 15, 8, 0),
    }).getValue();
    attendance.pullEvents();

    const result = attendance.clockOut();
    expect(result.isSuccess()).toBe(true);
    expect(attendance.status).toBe('CLOCKED_OUT');
    expect(attendance.clockedOutAt).not.toBeNull();
  });

  it('should record clocked-out event', () => {
    const attendance = Attendance.create({
      employeeId: 'emp-1',
      date: new Date(2026, 0, 15),
      clockedInAt: new Date(2026, 0, 15, 8, 0),
    }).getValue();
    attendance.pullEvents();

    attendance.clockOut();
    const events = attendance.pullEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('hr.attendance.clocked-out');
  });

  it('should fail to clock out if already clocked out', () => {
    const attendance = Attendance.create({
      employeeId: 'emp-1',
      date: new Date(2026, 0, 15),
      clockedInAt: new Date(2026, 0, 15, 8, 0),
    }).getValue();
    attendance.pullEvents();

    attendance.clockOut();
    attendance.pullEvents();

    const result = attendance.clockOut();
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('ATTENDANCE_ALREADY_CLOCKED_OUT');
  });

  it('should reconstitute from state', () => {
    const state = {
      id: 'test-id',
      employeeId: 'emp-1',
      date: new Date(2026, 0, 15),
      clockedInAt: new Date(2026, 0, 15, 8, 0),
      clockedOutAt: new Date(2026, 0, 15, 17, 0),
      status: 'CLOCKED_OUT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const attendance = Attendance.reconstitute(state);
    expect(attendance.id).toBe('test-id');
    expect(attendance.status).toBe('CLOCKED_OUT');
    expect(attendance.clockedOutAt).toEqual(state.clockedOutAt);
  });
});
