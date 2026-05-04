export declare class Result<T> {
    private readonly _value;
    private readonly _error;
    private readonly _isSuccess;
    private constructor();
    static ok<T>(value: T): Result<T>;
    static fail<T>(error: string): Result<T>;
    isSuccess(): boolean;
    isFailure(): boolean;
    getValue(): T;
    getError(): string;
}
