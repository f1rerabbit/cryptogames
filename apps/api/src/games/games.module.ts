import { Module } from "@nestjs/common";
import { LedgerModule } from "../ledger/ledger.module.js";
import { GamesController } from "./games.controller.js";
import { GamesService } from "./games.service.js";
@Module({
  imports: [LedgerModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
