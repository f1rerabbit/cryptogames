import { createHash, randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import {
  GameSessionStatus,
  ProviderEventType,
  SettlementResult,
  WagerStatus,
} from "@cg/db";
import { ApplicationError } from "../common/application-error.js";
import { DatabaseService } from "../database/database.service.js";
import { runSerializableWithRetry } from "../database/serializable.js";
import { financialError } from "../common/domain-error.js";
import { GamesService } from "../games/games.service.js";
import {
  GAME_PROVIDER,
  canonicalProviderPayload,
  type GameProviderPort,
  type ProviderCallback,
} from "./provider.port.js";
@Injectable()
export class ProviderService {
  constructor(
    @Inject(DatabaseService) private db: DatabaseService,
    @Inject(GAME_PROVIDER) private provider: GameProviderPort,
    @Inject(GamesService) private games: GamesService,
  ) {}
  private demo() {
    if (!["demo", "test"].includes(process.env.APP_MODE ?? "demo"))
      throw new ApplicationError(
        "SIMULATOR_DISABLED",
        "Demo simulator is disabled",
        404,
      );
  }
  async configure(
    gameId: string,
    scenario: ProviderCallback["scenario"],
    actorId: string,
    correlationId: string,
  ) {
    this.demo();
    const value = await this.db.providerScenarioFixture.upsert({
      where: { gameId },
      update: { scenario: scenario!, updatedBy: actorId },
      create: { gameId, scenario: scenario!, updatedBy: actorId },
    });
    await this.db.auditEvent.create({
      data: {
        actorId,
        subjectId: gameId,
        action: "PROVIDER_SCENARIO_CONFIGURE",
        outcome: "SUCCESS",
        correlationId,
        metadata: { scenario: scenario! },
      },
    });
    return value;
  }
  async simulate(wagerId: string, actorId: string, correlationId: string) {
    this.demo();
    const wager = await this.db.gameWager.findUnique({
      where: { id: wagerId },
      include: { game: { include: { scenarioFixture: true } }, session: true },
    });
    if (!wager)
      throw new ApplicationError("WAGER_NOT_FOUND", "Wager not found", 404);
    const scenario = wager.game.scenarioFixture?.scenario;
    if (!scenario)
      throw new ApplicationError(
        "SCENARIO_NOT_CONFIGURED",
        "Demo scenario is not configured",
        409,
      );
    if (scenario !== "REFUND") {
      const commit: ProviderCallback = {
        eventId: `demo-event-${randomUUID()}`,
        providerSessionId: wager.session.providerSessionId,
        providerRoundId: wager.providerRoundId,
        type: ProviderEventType.COMMIT,
      };
      await this.process(
        commit,
        this.provider.sign(commit),
        actorId,
        correlationId,
      );
    }
    const callback: ProviderCallback = {
      eventId: `demo-event-${randomUUID()}`,
      providerSessionId: wager.session.providerSessionId,
      providerRoundId: wager.providerRoundId,
      type:
        scenario === "REFUND"
          ? ProviderEventType.REFUND
          : ProviderEventType.SETTLE,
      scenario,
    };
    return this.process(
      callback,
      this.provider.sign(callback),
      actorId,
      correlationId,
    );
  }
  async process(
    callback: ProviderCallback,
    signature: string,
    actorId: string,
    correlationId: string,
  ) {
    this.demo();
    if (!this.provider.verify(callback, signature))
      throw new ApplicationError(
        "PROVIDER_AUTH_INVALID",
        "Invalid provider authentication",
        401,
      );
    if (
      (callback.type === ProviderEventType.COMMIT && callback.scenario) ||
      (callback.type === ProviderEventType.REFUND &&
        callback.scenario !== SettlementResult.REFUND) ||
      (callback.type === ProviderEventType.SETTLE &&
        (!callback.scenario || callback.scenario === SettlementResult.REFUND))
    )
      throw new ApplicationError(
        "PROVIDER_PAYLOAD_INVALID",
        "Provider event type and scenario do not match",
        422,
      );
    const hash = createHash("sha256")
      .update(canonicalProviderPayload(callback))
      .digest("hex");
    return runSerializableWithRetry(this.db, async (tx) => {
      const existing = await tx.providerEvent.findUnique({
        where: { eventId: callback.eventId },
      });
      if (existing) {
        if (existing.payloadHash !== hash) throw financialError.idempotency();
        const wager = await tx.gameWager.findUniqueOrThrow({
          where: { id: existing.wagerId },
        });
        return {
          duplicate: true,
          eventId: existing.eventId,
          wager: this.resultView(wager),
        };
      }
      const located = await tx.gameWager.findUnique({
        where: { providerRoundId: callback.providerRoundId },
      });
      if (!located)
        throw new ApplicationError(
          "WAGER_NOT_FOUND",
          "Provider wager not found",
          404,
        );
      await tx.$queryRaw`SELECT "id" FROM "GameWager" WHERE "id"=${located.id}::uuid FOR UPDATE`;
      const wager = await tx.gameWager.findUniqueOrThrow({
        where: { id: located.id },
        include: { session: true },
      });
      if (wager.session.providerSessionId !== callback.providerSessionId)
        throw new ApplicationError(
          "PROVIDER_SESSION_MISMATCH",
          "Provider session does not match wager",
          409,
        );
      if (callback.type === ProviderEventType.COMMIT) {
        if (wager.status !== WagerStatus.ACCEPTED)
          throw new ApplicationError(
            "PROVIDER_EVENT_OUT_OF_ORDER",
            "Commit is out of order",
            409,
          );
        const priorCommit = await tx.providerEvent.findFirst({
          where: { wagerId: wager.id, type: ProviderEventType.COMMIT },
        });
        if (priorCommit)
          throw new ApplicationError(
            "PROVIDER_EVENT_OUT_OF_ORDER",
            "Wager is already committed",
            409,
          );
        const event = await tx.providerEvent.create({
          data: {
            eventId: callback.eventId,
            wagerId: wager.id,
            sessionId: wager.sessionId,
            type: callback.type,
            payloadHash: hash,
          },
        });
        await tx.auditEvent.create({
          data: {
            actorId,
            subjectId: wager.id,
            action: "PROVIDER_COMMIT",
            outcome: "SUCCESS",
            correlationId,
            metadata: { eventId: event.eventId },
          },
        });
        return {
          duplicate: false,
          eventId: event.eventId,
          committed: true,
          wager: this.resultView(wager),
        };
      }
      if (
        callback.type === ProviderEventType.SETTLE &&
        !(await tx.providerEvent.findFirst({
          where: { wagerId: wager.id, type: ProviderEventType.COMMIT },
        }))
      )
        throw new ApplicationError(
          "PROVIDER_EVENT_OUT_OF_ORDER",
          "Settlement requires commit",
          409,
        );
      if (wager.status !== WagerStatus.ACCEPTED)
        throw new ApplicationError(
          "WAGER_ALREADY_SETTLED",
          "Wager is already settled",
          409,
        );
      const settled = await this.games.settleWithin(
        tx,
        wager.id,
        callback.eventId,
        actorId,
        correlationId,
        callback.scenario,
      );
      await tx.providerEvent.create({
        data: {
          eventId: callback.eventId,
          wagerId: wager.id,
          sessionId: wager.sessionId,
          type: callback.type,
          scenario: callback.scenario ?? null,
          payloadHash: hash,
        },
      });
      await tx.gameSession.update({
        where: { id: wager.sessionId },
        data: { status: GameSessionStatus.COMPLETED, completedAt: new Date() },
      });
      return {
        duplicate: false,
        eventId: callback.eventId,
        wager: settled,
        settled,
      };
    });
  }
  private resultView(wager: {
    id: string;
    status: WagerStatus;
    result: SettlementResult | null;
    payout: bigint | null;
  }) {
    return {
      id: wager.id,
      status: wager.status,
      result: wager.result,
      payout: wager.payout?.toString() ?? null,
    };
  }
}
