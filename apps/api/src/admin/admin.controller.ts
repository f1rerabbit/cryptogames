import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { AllowRoles, type AuthenticatedUser } from "../common/security.js";
import { PlayerStatus } from "@cg/db";
import { AdminIdDto, AdjustmentDto, GamePatchDto } from "./admin.dto.js";
import { AdminService } from "./admin.service.js";
type R = Request & { correlationId: string; user: AuthenticatedUser };
@Controller("admin")
@AllowRoles("ADMIN")
export class AdminController {
  constructor(@Inject(AdminService) private s: AdminService) {}
  @Get("players") players() {
    return this.s.players();
  }
  @Get("players/:id") player(@Param() p: AdminIdDto) {
    return this.s.player(p.id);
  }
  @Post("players/:id/credit")
  @AllowRoles("ADMIN", "FINANCE")
  credit(@Param() p: AdminIdDto, @Body() b: AdjustmentDto, @Req() r: R) {
    return this.s.adjust(
      p.id,
      "credit",
      b.amount,
      b.reason,
      b.ticket,
      b.idempotencyKey,
      r.user.id,
      r.correlationId,
    );
  }
  @Post("players/:id/debit")
  @AllowRoles("ADMIN", "FINANCE")
  debit(@Param() p: AdminIdDto, @Body() b: AdjustmentDto, @Req() r: R) {
    return this.s.adjust(
      p.id,
      "debit",
      b.amount,
      b.reason,
      b.ticket,
      b.idempotencyKey,
      r.user.id,
      r.correlationId,
    );
  }
  @Post("players/:id/freeze") freeze(@Param() p: AdminIdDto, @Req() r: R) {
    return this.s.status(p.id, PlayerStatus.FROZEN, r.user.id, r.correlationId);
  }
  @Post("players/:id/unfreeze") unfreeze(@Param() p: AdminIdDto, @Req() r: R) {
    return this.s.status(p.id, PlayerStatus.ACTIVE, r.user.id, r.correlationId);
  }
  @Get("ledger/transactions") ledger() {
    return this.s.ledgerTransactions();
  }
  @Get("audit") audit() {
    return this.s.audit();
  }
  @Get("game-sessions") sessions() {
    return this.s.sessions();
  }
  @Get("games") games() {
    return this.s.games();
  }
  @Patch("games/:id") patch(
    @Param() p: AdminIdDto,
    @Body() b: GamePatchDto,
    @Req() r: R,
  ) {
    return this.s.patchGame(p.id, b, r.user.id, r.correlationId);
  }
}
