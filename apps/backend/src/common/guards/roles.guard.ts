import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { CustomRolesService } from '../../modules/custom-roles/custom-roles.service';

/**
 * RBAC Guard - Checks if user has required role(s).
 *
 * A user's `role` is either a built-in Role enum value (checked directly,
 * same as before) or a custom role code - in that case, CustomRolesService
 * resolves it to the set of built-in roles it inherits API access from, so
 * every existing @Roles(...) check keeps working unmodified.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private customRolesService: CustomRolesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // User must be authenticated
    if (!user) {
      return false;
    }

    const effectiveRoles = await this.customRolesService.getEffectiveRoles(user.role);
    return requiredRoles.some((role) => effectiveRoles.includes(role));
  }
}
