import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CorrelationMiddleware } from "./common/http.js";
import { RbacGuard, SessionGuard } from "./common/security.js";
import { SafeLogger } from "./common/logger.js";
import { DatabaseModule } from "./database/database.module.js";
import { LedgerModule } from "./ledger/ledger.module.js";
import { ReadinessModule } from "./readiness/readiness.module.js";

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    AuthModule,
    LedgerModule,
    ReadinessModule,
  ],
  controllers: [AppController],
  providers: [
    SafeLogger,
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes("*");
  }
}
