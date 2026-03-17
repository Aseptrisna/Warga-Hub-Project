import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Roles decorator for RBAC
 *
 * Usage:
 * @Roles(Role.SUPER_ADMIN, Role.KEPALA_DESA)
 * @Get('protected-endpoint')
 * protectedMethod() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
