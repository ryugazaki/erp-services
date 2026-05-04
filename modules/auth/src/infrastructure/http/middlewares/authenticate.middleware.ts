import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@erp/core/http';
import { ITokenService } from '../../../application/ports/ITokenService';

export const createAuthMiddleware = (tokenService: ITokenService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json(
        ApiResponse.error('UNAUTHORIZED', 'Authorization header is missing or malformed', 401),
      );
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await tokenService.verifyAccessToken(token);
      (req as any).user = payload;
      next();
    } catch (err: any) {
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
      const message = code === 'TOKEN_EXPIRED' ? 'Token has expired' : 'Token is invalid';
      res.status(401).json(ApiResponse.error(code, message, 401));
    }
  };
};
