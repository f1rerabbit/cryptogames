import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
export function serializeResponse(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value === null || value === undefined || typeof value !== "object")
    return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value))
    return { type: "Buffer", data: value.toString("base64") };
  if (seen.has(value))
    throw new TypeError("Circular response is not serializable");
  seen.add(value);
  try {
    if (Array.isArray(value))
      return value.map((item) => serializeResponse(item, seen));
    const proto = Reflect.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      if (
        "toJSON" in value &&
        typeof (value as { toJSON?: unknown }).toJSON === "function"
      )
        return serializeResponse(
          (value as { toJSON: () => unknown }).toJSON(),
          seen,
        );
      return value;
    }
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value))
      if (item !== undefined) output[key] = serializeResponse(item, seen);
    return output;
  } finally {
    seen.delete(value);
  }
}
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((value) => serializeResponse(value)));
  }
}
