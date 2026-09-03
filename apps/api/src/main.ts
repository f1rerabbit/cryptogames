import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { parseEnv } from "@cg/config";
import { AppModule } from "./app.module.js";
import { SafeLogger } from "./common/logger.js";
import { configureApp } from "./configure-app.js";
async function bootstrap() {
  const environment = parseEnv(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(SafeLogger));
  configureApp(app, [environment.WEB_ORIGIN, environment.ADMIN_ORIGIN]);
  await app.listen(environment.API_PORT);
}
void bootstrap();
