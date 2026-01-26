import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPermissions) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();

        // permissions are nested in roles -> permissions
        const userPermissions = user.roles?.flatMap(role => role.permissions?.map(p => p.name)) || [];

        return requiredPermissions.every((permission) => userPermissions.includes(permission));
    }
}
