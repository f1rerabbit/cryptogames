import { ValidationPipe, type INestApplication } from "@nestjs/common";
import helmet from "helmet";
import { SafeExceptionFilter } from "./common/http.js";

export function configureApp(app: INestApplication, allowedOrigins: string[]) {
  app.use(helmet());
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new SafeExceptionFilter());
  app.setGlobalPrefix("v1");
}
