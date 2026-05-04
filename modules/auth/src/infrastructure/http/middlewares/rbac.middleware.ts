import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@erp/core/http';

function extractModule(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[1] ?? '';
}

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json(
        ApiResponse.error('UNAUTHORIZED', 'Not authenticated', 401),
      );
      return;
    }

    const moduleRequired = extractModule(req.path);
    const hasModuleAccess =
      user.permissions?.includes('*') ||
      user.moduleAccess?.includes(moduleRequired);

    if (!hasModuleAccess) {
      res.status(403).json(
        ApiResponse.error('MODULE_ACCESS_DENIED', `You do not have access to the ${moduleRequired} module`, 403),
      );
      return;
    }

    const hasAllPermissions =
      user.permissions?.includes('*') ||
      permissions.every((p) => user.permissions?.includes(p));

    if (!hasAllPermissions) {
      res.status(403).json(
        ApiResponse.error('INSUFFICIENT_PERMISSIONS', 'You do not have the required permissions', 403),
      );
      return;
    }

    next();
  };
};
