import { createHmac, randomBytes } from "node:crypto";
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import argon2 from "argon2";
import { Prisma, RoleName } from "@cg/db";
import type { Role } from "@cg/contracts";
import { AuditService } from "../audit/audit.service.js";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  async register(email: string, password: string, correlationId: string) {
    const normalized = email.trim().toLowerCase();
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    try {
      const user = await this.db.$transaction(async (tx) => {
        const role = await tx.role.findUniqueOrThrow({
          where: { name: RoleName.PLAYER },
        });
        const created = await tx.user.create({
          data: {
            email: normalized,
            passwordHash,
            roles: { create: { roleId: role.id } },
          },
          select: { id: true, email: true, createdAt: true },
        });
        await tx.auditEvent.create({
          data: {
            actorId: created.id,
            subjectId: created.id,
            action: "AUTH_REGISTER",
            outcome: "SUCCESS",
            correlationId,
            metadata: {},
          },
        });
        return created;
      });
      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException("Account already exists");
      throw error;
    }
  }

  async login(email: string, password: string, correlationId: string) {
    const user = await this.db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    let passwordValid = false;
    if (user) passwordValid = await argon2.verify(user.passwordHash, password);
    else await argon2.hash(password, { type: argon2.argon2id });
    if (!user || !passwordValid) {
      await this.audit.record({
        action: "AUTH_LOGIN",
        outcome: "DENIED",
        reason: "INVALID_CREDENTIALS",
        correlationId,
      });
      throw new UnauthorizedException("Invalid credentials");
    }
    const token = randomBytes(32).toString("base64url");
    const session = await this.db.$transaction(async (tx) => {
      const created = await tx.session.create({
        data: {
          userId: user.id,
          tokenHash: this.tokenHash(token),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        },
        select: { id: true, expiresAt: true },
      });
      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          subjectId: created.id,
          action: "AUTH_LOGIN",
          outcome: "SUCCESS",
          correlationId,
          metadata: {},
        },
      });
      return created;
    });
    return { token, session };
  }

  async authenticate(token: string) {
    const session = await this.db.session.findUnique({
      where: { tokenHash: this.tokenHash(token) },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== "ACTIVE"
    )
      return undefined;
    return {
      sessionId: session.id,
      token,
      id: session.user.id,
      email: session.user.email,
      roles: session.user.roles.map(({ role }) => role.name as Role),
    };
  }

  async listSessions(userId: string) {
    return this.db.session.findMany({
      where: { userId },
      select: { id: true, createdAt: true, expiresAt: true, revokedAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async logout(userId: string, token: string, correlationId: string) {
    const tokenHash = this.tokenHash(token);
    const session = await this.db.session.findFirst({
      where: { userId, tokenHash, revokedAt: null },
    });
    if (session)
      await this.revoke(userId, session.id, correlationId, "AUTH_LOGOUT");
  }

  async revoke(
    userId: string,
    sessionId: string,
    correlationId: string,
    action = "AUTH_SESSION_REVOKE",
  ) {
    const result = await this.db.$transaction(async (tx) => {
      const updated = await tx.session.updateMany({
        where: { id: sessionId, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (updated.count)
        await tx.auditEvent.create({
          data: {
            actorId: userId,
            subjectId: sessionId,
            action,
            outcome: "SUCCESS",
            correlationId,
            metadata: {},
          },
        });
      return updated;
    });
    return { revoked: result.count === 1 };
  }

  private tokenHash(token: string) {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32)
      throw new Error("SESSION_SECRET is not configured securely");
    return createHmac("sha256", secret).update(token).digest("hex");
  }
}
