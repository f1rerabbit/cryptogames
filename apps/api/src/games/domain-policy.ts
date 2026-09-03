import { SettlementResult } from "@cg/db";
export function validateBet(stake: bigint, min: bigint, max: bigint) {
  return stake >= min && stake <= max;
}
export function deterministicResult(id: string) {
  const values = [
    SettlementResult.LOSS,
    SettlementResult.WIN_SMALL,
    SettlementResult.WIN_LARGE,
    SettlementResult.REFUND,
  ];
  return values[parseInt(id.slice(-2), 16) % values.length]!;
}
export function payoutFor(result: SettlementResult, stake: bigint) {
  if (result === SettlementResult.LOSS) return 0n;
  if (result === SettlementResult.WIN_LARGE) return stake * 2n;
  return stake;
}
