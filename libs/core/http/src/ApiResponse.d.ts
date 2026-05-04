export interface SuccessResponse<T> {
    success: true;
    statusCode: number;
    message: string;
    data: T;
    meta?: {
        pagination: PaginationMeta;
    };
    timestamp: string;
    requestId: string;
}
export interface ErrorResponse {
    success: false;
    statusCode: number;
    error: {
        code: string;
        message: string;
        details?: FieldError[];
    };
    timestamp: string;
    requestId: string;
}
export interface FieldError {
    field: string;
    message: string;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
export declare class ApiResponse {
    static success<T>(data: T, message: string, statusCode?: number): SuccessResponse<T>;
    static paginated<T>(data: T[], message: string, pagination: PaginationMeta): SuccessResponse<T[]>;
    static error(code: string, message: string, statusCode: number, details?: FieldError[]): ErrorResponse;
}
