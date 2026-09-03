import { Inject, Injectable } from "@nestjs/common";
import { createClient } from "redis";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class ReadinessService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  async check() {
    const checks = { postgres: false, redis: false };
    try {
      await this.db.$queryRaw`SELECT 1`;
      checks.postgres = true;
    } catch {
      checks.postgres = false;
    }
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return { ready: false, checks };
    const redis = createClient({
      url: redisUrl,
      socket: { connectTimeout: 2_000 },
    });
    redis.on("error", () => undefined);
    try {
      await redis.connect();
      checks.redis = (await redis.ping()) === "PONG";
    } catch {
      checks.redis = false;
    } finally {
      if (redis.isOpen) {
        try {
          await redis.disconnect();
        } catch {
          checks.redis = false;
        }
      }
    }
    return { ready: checks.postgres && checks.redis, checks };
  }
}
