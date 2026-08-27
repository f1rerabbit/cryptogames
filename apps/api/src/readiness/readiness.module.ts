import { Module } from "@nestjs/common";
import { ReadinessService } from "./readiness.service.js";
@Module({ providers: [ReadinessService], exports: [ReadinessService] })
export class ReadinessModule {}
