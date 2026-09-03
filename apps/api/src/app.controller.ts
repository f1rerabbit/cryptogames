import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Public } from "./common/security.js";
import { ReadinessService } from "./readiness/readiness.service.js";

@Controller()
export class AppController {
  constructor(
    @Inject(ReadinessService)
    private readonly readiness: ReadinessService,
  ) {}

  @Public()
  @Get("health")
  health() {
    return { status: "ok", service: "api" };
  }

  @Public()
  @Get("ready")
  async ready() {
    const result = await this.readiness.check();
    if (!result.ready)
      throw new ServiceUnavailableException({
        status: "not-ready",
        checks: result.checks,
      });
    return { status: "ready", checks: result.checks };
  }
}
