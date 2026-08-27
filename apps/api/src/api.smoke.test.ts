import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { AppModule } from "./app.module.js";
import { DatabaseService } from "./database/database.service.js";
import { ReadinessService } from "./readiness/readiness.service.js";

describe("API smoke", () => {
  it("serves public health with a correlation id", async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue({ $connect: vi.fn(), $disconnect: vi.fn() })
      .overrideProvider(ReadinessService)
      .useValue({
        check: vi.fn().mockResolvedValue({
          ready: true,
          checks: { postgres: true, redis: true },
        }),
      })
      .compile();
    const app = module.createNestApplication();
    await app.init();
    const response = await request(app.getHttpServer())
      .get("/health")
      .expect(200);
    expect((response.body as { status: string }).status).toBe("ok");
    expect(response.headers["x-correlation-id"]).toBeTruthy();
    await app.close();
  });
});
