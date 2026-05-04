import { RequestContext } from './RequestContext';

export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: { pagination: PaginationMeta };
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

export class ApiResponse {
  static success<T>(data: T, message: string, statusCode = 200): SuccessResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: RequestContext.getId(),
    };
  }

  static paginated<T>(
    data: T[],
    message: string,
    pagination: PaginationMeta,
  ): SuccessResponse<T[]> {
    return {
      success: true,
      statusCode: 200,
      message,
      data,
      meta: { pagination },
      timestamp: new Date().toISOString(),
      requestId: RequestContext.getId(),
    };
  }

  static error(
    code: string,
    message: string,
    statusCode: number,
    details?: FieldError[],
  ): ErrorResponse {
    return {
      success: false,
      statusCode,
      error: { code, message, ...(details && { details }) },
      timestamp: new Date().toISOString(),
      requestId: RequestContext.getId(),
    };
  }
}
