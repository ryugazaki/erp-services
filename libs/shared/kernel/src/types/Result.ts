export class Result<T> {
  private constructor(
    private readonly _value: T | undefined,
    private readonly _error: string | undefined,
    private readonly _isSuccess: boolean,
  ) {}

  static ok<T>(value: T): Result<T> {
    return new Result(value, undefined, true);
  }

  static fail<T>(error: string): Result<T> {
    return new Result<T>(undefined, error, false);
  }

  isSuccess(): boolean {
    return this._isSuccess;
  }

  isFailure(): boolean {
    return !this._isSuccess;
  }

  getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot getValue on failed Result');
    }
    return this._value as T;
  }

  getError(): string {
    if (this._isSuccess) {
      throw new Error('Cannot getError on successful Result');
    }
    return this._error as string;
  }
}
