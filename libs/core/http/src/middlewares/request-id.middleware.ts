import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../RequestContext';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || RequestContext.getId();
  RequestContext.setId(requestId);
  res.setHeader('X-Request-ID', requestId);
  next();
}
