import { Module } from "@nestjs/common";
import { GamesModule } from "../games/games.module.js";
import { DemoProviderAdapter } from "./demo-provider.adapter.js";
import { ProviderController } from "./provider.controller.js";
import { GAME_PROVIDER } from "./provider.port.js";
import { ProviderService } from "./provider.service.js";
@Module({
  imports: [GamesModule],
  controllers: [ProviderController],
  providers: [
    ProviderService,
    { provide: GAME_PROVIDER, useClass: DemoProviderAdapter },
  ],
  exports: [ProviderService, GAME_PROVIDER],
})
export class ProviderModule {}
