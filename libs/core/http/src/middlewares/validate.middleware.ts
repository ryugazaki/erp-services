import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../ApiResponse';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = (result.error as ZodError).errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json(
        ApiResponse.error('VALIDATION_ERROR', 'Request validation failed', 400, details),
      );
    }

    req.body = result.data;
    next();
  };
}
