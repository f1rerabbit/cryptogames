import { ProviderEventType, SettlementResult } from "@cg/db";
export type ProviderCallback = {
  eventId: string;
  providerSessionId: string;
  providerRoundId: string;
  type: ProviderEventType;
  scenario?: SettlementResult;
};
export interface GameProviderPort {
  createSessionId(): string;
  createRoundId(): string;
  sign(callback: ProviderCallback): string;
  verify(callback: ProviderCallback, signature: string): boolean;
}
export const GAME_PROVIDER = Symbol("GAME_PROVIDER");
