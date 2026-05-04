import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../ApiResponse';
import { Logger } from '@erp/shared/utils';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  Logger.error('Unhandled error', { error: err.message, stack: err.stack });

  return res.status(500).json(
    ApiResponse.error(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred. Please try again later.',
      500,
    ),
  );
}
