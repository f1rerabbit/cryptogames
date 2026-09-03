import { createHash, randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ProviderEventType, WagerStatus } from "@cg/db";
import { ApplicationError } from "../common/application-error.js";
import { DatabaseService } from "../database/database.service.js";
import { GamesService } from "../games/games.service.js";
import {
  GAME_PROVIDER,
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
    const hash = createHash("sha256")
      .update(JSON.stringify(callback))
      .digest("hex");
    const existing = await this.db.providerEvent.findUnique({
      where: { eventId: callback.eventId },
    });
    if (existing) {
      if (existing.payloadHash !== hash)
        throw new ApplicationError(
          "IDEMPOTENCY_CONFLICT",
          "Provider event payload conflicts",
          409,
        );
      return { duplicate: true, eventId: existing.eventId };
    }
    const wager = await this.db.gameWager.findUnique({
      where: { providerRoundId: callback.providerRoundId },
      include: { session: true },
    });
    if (!wager)
      throw new ApplicationError(
        "WAGER_NOT_FOUND",
        "Provider wager not found",
        404,
      );
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
      if (
        await this.db.providerEvent.findFirst({
          where: { wagerId: wager.id, type: ProviderEventType.COMMIT },
        })
      )
        throw new ApplicationError(
          "PROVIDER_EVENT_OUT_OF_ORDER",
          "Wager is already committed",
          409,
        );
      await this.db.providerEvent.create({
        data: {
          eventId: callback.eventId,
          wagerId: wager.id,
          sessionId: wager.sessionId,
          type: callback.type,
          payloadHash: hash,
        },
      });
      return { eventId: callback.eventId, committed: true };
    }
    if (
      callback.type === ProviderEventType.SETTLE &&
      !(await this.db.providerEvent.findFirst({
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
    const settled = await this.games.settle(
      wager.id,
      callback.eventId,
      actorId,
      correlationId,
      callback.scenario,
      {
        eventId: callback.eventId,
        sessionId: wager.sessionId,
        type: callback.type,
        payloadHash: hash,
      },
    );
    return { eventId: callback.eventId, settled };
  }
}
