import { ApplicationError } from "./application-error.js";
export class FinancialError extends ApplicationError {}
export const financialError = {
  idempotency: () =>
    new FinancialError(
      "IDEMPOTENCY_CONFLICT",
      "Idempotency key has different input",
      409,
    ),
  funds: () =>
    new FinancialError("INSUFFICIENT_FUNDS", "Insufficient TSC balance", 409),
};
