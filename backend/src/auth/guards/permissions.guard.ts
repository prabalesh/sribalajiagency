import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    // Admin role bypasses all permission checks
    if (user.roles?.some((ur: any) => ur.role?.name === 'admin')) {
      return true;
    }

    // permissions are nested in roles -> role -> permissions -> permission
    const userPermissions =
      user.roles?.flatMap(
        (ur: any) =>
          ur.role?.permissions?.map((rp: any) => rp.permission?.name) || [],
      ) || [];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
