import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  NestMiddleware,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const supplied = req.header("x-correlation-id");
    const id =
      supplied && /^[a-zA-Z0-9-]{8,128}$/.test(supplied)
        ? supplied
        : randomUUID();
    res.setHeader("x-correlation-id", id);
    Object.assign(req, { correlationId: id });
    next();
  }
}

function getHttpStatus(error: unknown): number {
  if (error instanceof HttpException) return error.getStatus();
  if (
    typeof error === "object" &&
    error !== null &&
    "getStatus" in error &&
    typeof (error as { getStatus?: unknown }).getStatus === "function"
  ) {
    const status = (error as { getStatus: () => unknown }).getStatus();
    if (
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 400 &&
      status <= 599
    )
      return status;
  }
  return 500;
}

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host
      .switchToHttp()
      .getRequest<Request & { correlationId?: string }>();
    const status = getHttpStatus(error);
    const code = status === 500 ? "INTERNAL_ERROR" : "REQUEST_REJECTED";
    response.status(status).json({
      error: {
        code,
        message:
          status === 500
            ? "Unexpected server error"
            : error instanceof Error
              ? error.message
              : "Request rejected",
        correlationId: request.correlationId ?? "unknown",
      },
    });
  }
}
