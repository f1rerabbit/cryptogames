import {
  Body,
  Controller,
  Headers,
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
import {
  ProviderCallbackDto,
  ProviderIdDto,
  ScenarioDto,
} from "./provider.dto.js";
import { ProviderService } from "./provider.service.js";
type R = Request & { correlationId: string; user: AuthenticatedUser };
@Controller()
export class ProviderController {
  constructor(@Inject(ProviderService) private s: ProviderService) {}
  @AllowRoles("ADMIN") @Post("admin/games/:id/scenario") scenario(
    @Param() p: ProviderIdDto,
    @Body() b: ScenarioDto,
    @Req() r: R,
  ) {
    return this.s.configure(p.id, b.scenario, r.user.id, r.correlationId);
  }
  @AllowRoles("ADMIN") @Post("admin/wagers/:id/simulate") simulate(
    @Param() p: ProviderIdDto,
    @Req() r: R,
  ) {
    return this.s.simulate(p.id, r.user.id, r.correlationId);
  }
  @Public() @Post("internal/provider/callback") callback(
    @Body() b: ProviderCallbackDto,
    @Headers("x-provider-signature") sig: string,
    @Req() r: R,
  ) {
    return this.s.process(
      b,
      sig,
      "00000000-0000-0000-0000-000000000000",
      r.correlationId,
    );
  }
}
