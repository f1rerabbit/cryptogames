import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@cg/contracts";
import { AuthService } from "../auth/auth.service.js";

export const IS_PUBLIC = "is_public";
export const Public = () => SetMetadata(IS_PUBLIC, true);
export const ALLOW_ROLES = "allow_roles";
export const AllowRoles = (...roles: Role[]) => SetMetadata(ALLOW_ROLES, roles);
export type AuthenticatedUser = {
  sessionId: string;
  token: string;
  id: string;
  email: string;
  roles: Role[];
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}
  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token)
      throw new UnauthorizedException("Authentication required");
    const user = await this.auth.authenticate(token);
    if (!user) throw new UnauthorizedException("Authentication required");
    request.user = user;
    return true;
  }
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const allowed = this.reflector.getAllAndOverride<Role[]>(ALLOW_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed?.length) return false;
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    return allowed.some((role) => request.user?.roles.includes(role) === true);
  }
}
