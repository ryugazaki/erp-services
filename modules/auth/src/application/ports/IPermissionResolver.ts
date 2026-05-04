import { UserRole } from '../../domain/entities/User';

export interface IPermissionResolver {
  getPermissions(role: UserRole): string[];
  getModuleAccess(role: UserRole): string[];
}
