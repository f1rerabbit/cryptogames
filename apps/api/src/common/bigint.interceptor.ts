import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(
        map(
          (value) =>
            JSON.parse(
              JSON.stringify(value, (_key, item) =>
                typeof item === "bigint" ? item.toString() : item,
              ),
            ) as unknown,
        ),
      );
  }
}
