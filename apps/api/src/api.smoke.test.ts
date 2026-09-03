import type { Server } from "node:http";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { AppModule } from "./app.module.js";
import { DatabaseService } from "./database/database.service.js";
import { ReadinessService } from "./readiness/readiness.service.js";
import { configureApp } from "./configure-app.js";

describe("API smoke", () => {
  it("serves public health with a correlation id", async () => {
    const readinessCheck = vi
      .fn()
      .mockResolvedValueOnce({
        ready: true,
        checks: { postgres: true, redis: true },
      })
      .mockResolvedValueOnce({
        ready: false,
        checks: { postgres: true, redis: false },
      });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue({ $connect: vi.fn(), $disconnect: vi.fn() })
      .overrideProvider(ReadinessService)
      .useValue({ check: readinessCheck })
      .compile();
    const app = module.createNestApplication();
    configureApp(app, ["http://localhost:3000"]);
    await app.init();
    const server = app.getHttpServer() as Server;
    const response = await request(server).get("/v1/health").expect(200);
    expect((response.body as { status: string }).status).toBe("ok");
    expect(response.headers["x-correlation-id"]).toBeTruthy();
    await request(server).get("/v1/ready").expect(200);
    await request(server).get("/v1/ready").expect(503);
    await app.close();
  });
});
