import { beforeEach, describe, expect, it, vi } from "vitest";
const redis = {
  on: vi.fn(),
  connect: vi.fn(),
  ping: vi.fn(),
  disconnect: vi.fn(),
  isOpen: true,
};
vi.mock("redis", () => ({ createClient: () => redis }));
import { ReadinessService } from "./readiness.service.js";

describe("readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redis.connect.mockResolvedValue(undefined);
    redis.ping.mockResolvedValue("PONG");
    redis.disconnect.mockResolvedValue(undefined);
  });
  it("is ready only when PostgreSQL and Redis respond", async () => {
    const service = new ReadinessService({
      $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]),
    } as never);
    await expect(service.check()).resolves.toEqual({
      ready: true,
      checks: { postgres: true, redis: true },
    });
  });
  it("fails closed when PostgreSQL is unavailable", async () => {
    const service = new ReadinessService({
      $queryRaw: vi.fn().mockRejectedValue(new Error("down")),
    } as never);
    await expect(service.check()).resolves.toMatchObject({
      ready: false,
      checks: { postgres: false },
    });
  });
  it("fails closed when Redis is unavailable", async () => {
    redis.connect.mockRejectedValueOnce(new Error("down"));
    const service = new ReadinessService({
      $queryRaw: vi.fn().mockResolvedValue([]),
    } as never);
    await expect(service.check()).resolves.toMatchObject({
      ready: false,
      checks: { redis: false },
    });
  });
});
