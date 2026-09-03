import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import {
  AllowRoles,
  Public,
  type AuthenticatedUser,
} from "../common/security.js";
import { GamesService } from "./games.service.js";
import { IdDto, SlugDto, WagerDto } from "./games.dto.js";
type AuthRequest = Request & { correlationId: string; user: AuthenticatedUser };
@Controller()
export class GamesController {
  constructor(@Inject(GamesService) private service: GamesService) {}
  @Public() @Get("games") catalog() {
    return this.service.catalog();
  }
  @Public() @Get("games/:slug") game(@Param() p: SlugDto) {
    return this.service.game(p.slug);
  }
  @AllowRoles("PLAYER") @Post("games/:slug/sessions") session(
    @Param() p: SlugDto,
    @Req() r: AuthRequest,
  ) {
    return this.service.createSession(r.user.id, p.slug, r.correlationId);
  }
  @AllowRoles("PLAYER") @Get("me/game-sessions") sessions(
    @Req() r: AuthRequest,
  ) {
    return this.service.sessions(r.user.id);
  }
  @AllowRoles("PLAYER") @Get("me/game-sessions/:id") one(
    @Param() p: IdDto,
    @Req() r: AuthRequest,
  ) {
    return this.service.session(r.user.id, p.id);
  }
  @AllowRoles("PLAYER") @Post("game-sessions/:id/wagers") wager(
    @Param() p: IdDto,
    @Body() b: WagerDto,
    @Req() r: AuthRequest,
  ) {
    return this.service.wager(
      r.user.id,
      p.id,
      b.stake,
      b.idempotencyKey,
      r.correlationId,
    );
  }
  @AllowRoles("PLAYER") @Post("me/game-sessions/:id/cancel") cancel(
    @Param() p: IdDto,
    @Req() r: AuthRequest,
  ) {
    return this.service.cancelSession(r.user.id, p.id, r.correlationId);
  }
}
