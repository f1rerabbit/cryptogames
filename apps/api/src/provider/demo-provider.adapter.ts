import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { GameProviderPort, ProviderCallback } from "./provider.port.js";
@Injectable()
export class DemoProviderAdapter implements GameProviderPort {
  createSessionId() {
    return `demo-session-${randomUUID()}`;
  }
  createRoundId() {
    return `demo-round-${randomUUID()}`;
  }
  sign(value: ProviderCallback) {
    return createHmac("sha256", this.secret())
      .update(this.payload(value))
      .digest("hex");
  }
  verify(value: ProviderCallback, signature: string) {
    const expected = this.sign(value);
    return (
      signature.length === expected.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    );
  }
  private payload(v: ProviderCallback) {
    return JSON.stringify([
      v.eventId,
      v.providerSessionId,
      v.providerRoundId,
      v.type,
      v.scenario ?? null,
    ]);
  }
  private secret() {
    const value =
      process.env.PROVIDER_CALLBACK_SECRET ?? process.env.SESSION_SECRET;
    if (!value || value.length < 32)
      throw new Error("Provider callback secret is not configured securely");
    return value;
  }
}
