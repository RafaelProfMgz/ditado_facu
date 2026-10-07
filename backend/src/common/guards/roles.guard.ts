import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { Role } from '../enums/role.enum.js';
import type { AuthUser } from '../types/auth-user.js';

/** Usar sempre depois do JwtAuthGuard: depende de req.user. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    return !!user && required.includes(user.role);
  }
}
