import { AttendanceStatus } from '../AttendanceStatus';

describe('AttendanceStatus', () => {
  it('should create CLOCKED_IN status', () => {
    const status = AttendanceStatus.create('CLOCKED_IN');
    expect(status.getValue()).toBe('CLOCKED_IN');
  });

  it('should create CLOCKED_OUT status', () => {
    const status = AttendanceStatus.create('CLOCKED_OUT');
    expect(status.getValue()).toBe('CLOCKED_OUT');
  });

  it('should create ABSENT status', () => {
    const status = AttendanceStatus.create('ABSENT');
    expect(status.getValue()).toBe('ABSENT');
  });

  it('should be case insensitive', () => {
    const status = AttendanceStatus.create('clocked_in');
    expect(status.getValue()).toBe('CLOCKED_IN');
  });

  it('should throw on invalid status', () => {
    expect(() => AttendanceStatus.create('INVALID')).toThrow();
  });

  it('should compare equality correctly', () => {
    const a = AttendanceStatus.create('CLOCKED_IN');
    const b = AttendanceStatus.create('CLOCKED_IN');
    const c = AttendanceStatus.create('CLOCKED_OUT');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
