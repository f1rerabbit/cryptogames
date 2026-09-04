import { z } from "zod";
export const envSchema = z.object({
  APP_MODE: z.enum(["demo", "test", "production"]).default("demo"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url(),
  ADMIN_ORIGIN: z.string().url(),
  DEMO_FAUCET_AMOUNT: z.coerce.bigint().positive().default(100000n),
  DEMO_GRANT_LIMIT: z.coerce.bigint().positive().default(1000000n),
  DEMO_GRANT_DAILY_LIMIT: z.coerce.bigint().positive().default(5000000n),
  PROVIDER_CALLBACK_SECRET: z.string().min(32),
});
export type Environment = z.infer<typeof envSchema>;
export function parseEnv(env: NodeJS.ProcessEnv): Environment {
  return envSchema.parse(env);
}
