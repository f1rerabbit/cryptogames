import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ROLES } from "@cg/contracts";
import type { Request, Response } from "express";
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
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.auth
      .login(body.email, body.password, req.correlationId)
      .then(({ token, session }) => {
        response.cookie("cg_session", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 8 * 60 * 60 * 1000,
          path: "/",
        });
        return { session };
      });
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
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(req.user.id, req.user.token, req.correlationId);
    response.clearCookie("cg_session", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  @AllowRoles(...ROLES) @Post("me/security/sessions/:id/revoke") revoke(
    @Param() params: SessionIdDto,
    @Req() req: AuthRequest,
  ) {
    return this.auth.revoke(req.user.id, params.id, req.correlationId);
  }
}
