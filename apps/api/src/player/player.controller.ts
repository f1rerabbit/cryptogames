import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { AllowRoles, type AuthenticatedUser } from "../common/security.js";
import { CursorDto, IdempotencyDto, ProfileDto } from "./player.dto.js";
import { PlayerService } from "./player.service.js";
type AuthRequest = Request & { correlationId: string; user: AuthenticatedUser };
@Controller("me")
@AllowRoles("PLAYER", "ADMIN")
export class PlayerController {
  constructor(@Inject(PlayerService) private service: PlayerService) {}
  @Get("profile") profile(@Req() req: AuthRequest) {
    return this.service.profile(req.user.id);
  }
  @Patch("profile") update(@Req() req: AuthRequest, @Body() body: ProfileDto) {
    return this.service.updateProfile(req.user.id, body.displayName);
  }
  @Get("wallet") wallet(@Req() req: AuthRequest) {
    return this.service.wallet(req.user.id);
  }
  @Post("wallet/faucet") faucet(
    @Req() req: AuthRequest,
    @Body() body: IdempotencyDto,
  ) {
    return this.service.faucet(
      req.user.id,
      body.idempotencyKey,
      req.correlationId,
    );
  }
  @Get("wallet/transactions") transactions(
    @Req() req: AuthRequest,
    @Query() query: CursorDto,
  ) {
    return this.service.transactions(req.user.id, query.cursor);
  }
}
