import { Injectable, type LoggerService } from "@nestjs/common";
import pino from "pino";

@Injectable()
export class SafeLogger implements LoggerService {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    redact: {
      paths: [
        "password",
        "token",
        "authorization",
        "req.headers.authorization",
        "*.password",
        "*.token",
      ],
      censor: "[REDACTED]",
    },
  });
  log(message: unknown, context?: string) {
    this.logger.info(this.fields(context), String(message));
  }
  error(message: unknown, trace?: string, context?: string) {
    this.logger.error(
      { ...this.fields(context), ...(trace ? { trace } : {}) },
      String(message),
    );
  }
  warn(message: unknown, context?: string) {
    this.logger.warn(this.fields(context), String(message));
  }
  debug(message: unknown, context?: string) {
    this.logger.debug(this.fields(context), String(message));
  }
  verbose(message: unknown, context?: string) {
    this.logger.trace(this.fields(context), String(message));
  }
  private fields(context?: string) {
    return context ? { context } : {};
  }
}
