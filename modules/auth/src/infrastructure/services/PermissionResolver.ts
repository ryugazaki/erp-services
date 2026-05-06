import { injectable } from 'tsyringe';
import { IPermissionResolver } from '../../application/ports/IPermissionResolver';
import { UserRole } from '../../domain/entities/User';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'hr:employees:read', 'hr:employees:write', 'hr:employees:delete',
    'hr:departments:read', 'hr:departments:write',
    'hr:leaves:read', 'hr:leaves:write', 'hr:leaves:approve',
    'hr:leave-types:read', 'hr:leave-types:write',
    'inventory:products:read', 'inventory:products:write',
    'inventory:stock:adjust',
    'finance:invoices:read', 'finance:invoices:write',
    'finance:reports:read',
    'ga:assets:read', 'ga:assets:write',
    'ga:procurement-requests:approve',
  ],
  MANAGER: [
    'hr:employees:read', 'hr:employees:write',
    'hr:departments:read',
    'hr:leaves:read', 'hr:leaves:write', 'hr:leaves:approve',
    'hr:leave-types:read',
    'inventory:products:read',
    'inventory:stock:adjust',
    'finance:invoices:read',
    'finance:reports:read',
    'ga:assets:read',
    'ga:procurement-requests:approve',
  ],
  EMPLOYEE: [
    'hr:employees:read',
    'hr:leaves:read', 'hr:leaves:write',
    'hr:leave-types:read',
    'inventory:products:read',
    'ga:assets:read',
  ],
  GUEST: [
    'inventory:products:read',
  ],
};

const ROLE_MODULE_ACCESS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['auth', 'hr', 'inventory', 'finance', 'ga'],
  ADMIN: ['auth', 'hr', 'inventory', 'finance', 'ga'],
  MANAGER: ['hr', 'inventory', 'finance', 'ga'],
  EMPLOYEE: ['hr', 'inventory', 'ga'],
  GUEST: ['inventory'],
};

@injectable()
export class PermissionResolver implements IPermissionResolver {
  getPermissions(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role] ?? [];
  }

  getModuleAccess(role: UserRole): string[] {
    return ROLE_MODULE_ACCESS[role] ?? [];
  }
}
