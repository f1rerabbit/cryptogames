import { Module } from "@nestjs/common";
import { LedgerModule } from "../ledger/ledger.module.js";
import { PlayerController } from "./player.controller.js";
import { PlayerService } from "./player.service.js";
@Module({
  imports: [LedgerModule],
  controllers: [PlayerController],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}
