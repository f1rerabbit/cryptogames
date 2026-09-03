import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { ROLES } from "@cg/contracts";
import type { Request } from "express";
import {
  AllowRoles,
  Public,
  type AuthenticatedUser,
} from "../common/security.js";
import { AuthService } from "./auth.service.js";
import { CredentialsDto, SessionIdDto } from "./auth.dto.js";

type AuthRequest = Request & { correlationId: string; user: AuthenticatedUser };
@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Public() @Post("auth/register") register(
    @Body() body: CredentialsDto,
    @Req() req: AuthRequest,
  ) {
    return this.auth.register(body.email, body.password, req.correlationId);
  }
  @Public() @HttpCode(200) @Post("auth/login") login(
    @Body() body: CredentialsDto,
    @Req() req: AuthRequest,
  ) {
    return this.auth.login(body.email, body.password, req.correlationId);
  }
  @AllowRoles(...ROLES) @Get("me") me(@Req() req: AuthRequest) {
    return {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles,
      sessionId: req.user.sessionId,
    };
  }
  @AllowRoles(...ROLES) @Get("me/security/sessions") sessions(
    @Req() req: AuthRequest,
  ) {
    return this.auth.listSessions(req.user.id);
  }
  @AllowRoles(...ROLES) @HttpCode(204) @Post("auth/logout") async logout(
    @Req() req: AuthRequest,
  ) {
    await this.auth.logout(req.user.id, req.user.token, req.correlationId);
  }
  @AllowRoles(...ROLES) @Post("me/security/sessions/:id/revoke") revoke(
    @Param() params: SessionIdDto,
    @Req() req: AuthRequest,
  ) {
    return this.auth.revoke(req.user.id, params.id, req.correlationId);
  }
}
