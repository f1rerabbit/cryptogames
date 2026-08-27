import { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import { RbacGuard } from "./security.js";

describe("RBAC deny by default", () => {
  it("denies a protected handler without an explicit role policy", () => {
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(undefined),
    } as unknown as Reflector;
    const context = {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ["ADMIN"] } }),
      }),
    };
    expect(new RbacGuard(reflector).canActivate(context as never)).toBe(false);
  });
});
