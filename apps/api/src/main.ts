import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { parseEnv } from "@cg/config";
import { AppModule } from "./app.module.js";
import { SafeExceptionFilter } from "./common/http.js";
import { SafeLogger } from "./common/logger.js";
async function bootstrap() {
  const environment = parseEnv(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(SafeLogger));
  app.use(helmet());
  app.enableCors({
    origin: [environment.WEB_ORIGIN, environment.ADMIN_ORIGIN],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new SafeExceptionFilter());
  app.setGlobalPrefix("v1");
  await app.listen(environment.API_PORT);
}
void bootstrap();
