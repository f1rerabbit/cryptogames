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
import {
  AdminIdDto,
  AdjustmentDto,
  CorrectionDto,
  GamePatchDto,
  GrantExecuteDto,
  RoleDto,
} from "./admin.dto.js";
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
  @Post("players/:id/grants/preview")
  @AllowRoles("ADMIN", "FINANCE")
  preview(@Param() p: AdminIdDto, @Body() b: AdjustmentDto, @Req() r: R) {
    return this.s.previewGrant(
      p.id,
      b.amount,
      b.reason,
      b.ticket,
      r.user.id,
      r.correlationId,
    );
  }
  @Post("grants/:id/confirm")
  @AllowRoles("ADMIN", "FINANCE")
  confirm(@Param() p: AdminIdDto, @Body() b: GrantExecuteDto, @Req() r: R) {
    return this.s.confirmGrant(
      p.id,
      b.previewHash,
      b.idempotencyKey,
      r.user.id,
      r.correlationId,
    );
  }
  @Post("ledger/corrections") @AllowRoles("ADMIN", "FINANCE") correction(
    @Body() b: CorrectionDto,
    @Req() r: R,
  ) {
    return this.s.correct(
      b.originalTransactionId,
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
  @Post("users/:id/roles") roleAdd(
    @Param() p: AdminIdDto,
    @Body() b: RoleDto,
    @Req() r: R,
  ) {
    return this.s.setRole(p.id, b.role, true, r.user.id, r.correlationId);
  }
  @Post("users/:id/roles/remove") roleRemove(
    @Param() p: AdminIdDto,
    @Body() b: RoleDto,
    @Req() r: R,
  ) {
    return this.s.setRole(p.id, b.role, false, r.user.id, r.correlationId);
  }
  @Get("ledger/transactions") ledger() {
    return this.s.ledgerTransactions();
  }
  @Get("dashboard") dashboard() {
    return this.s.dashboard();
  }
  @Get("audit") audit(@Req() request: R) {
    const query = request.query as {
      action?: string;
      actorId?: string;
      outcome?: string;
    };
    return this.s.audit(query);
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
