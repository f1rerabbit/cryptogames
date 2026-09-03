import { Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";

export type AuditInput = {
  actorId?: string;
  subjectId?: string;
  action: string;
  outcome: "SUCCESS" | "DENIED";
  reason?: string;
  correlationId: string;
  metadata?: Record<string, string>;
};
@Injectable()
export class AuditService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  async record(event: AuditInput) {
    await this.db.auditEvent.create({
      data: {
        ...(event.actorId ? { actorId: event.actorId } : {}),
        ...(event.subjectId ? { subjectId: event.subjectId } : {}),
        ...(event.reason ? { reason: event.reason } : {}),
        action: event.action,
        outcome: event.outcome,
        correlationId: event.correlationId,
        metadata: event.metadata ?? {},
      },
    });
  }
}
