import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CorrelationMiddleware } from "./common/http.js";
import { RbacGuard, SessionGuard } from "./common/security.js";
import { SafeLogger } from "./common/logger.js";
import { DatabaseModule } from "./database/database.module.js";
import { LedgerModule } from "./ledger/ledger.module.js";
import { ReadinessModule } from "./readiness/readiness.module.js";
import { PlayerModule } from "./player/player.module.js";
import { GamesModule } from "./games/games.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { BigIntInterceptor } from "./common/bigint.interceptor.js";
import { ProviderModule } from "./provider/provider.module.js";

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    AuthModule,
    LedgerModule,
    ReadinessModule,
    PlayerModule,
    GamesModule,
    AdminModule,
    ProviderModule,
  ],
  controllers: [AppController],
  providers: [
    SafeLogger,
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: BigIntInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes("*");
  }
}
