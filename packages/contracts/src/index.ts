export const ROLES = [
  "PLAYER",
  "SUPPORT",
  "FINANCE",
  "RISK",
  "CONTENT",
  "ADMIN",
  "AUDITOR",
] as const;
export type Role = (typeof ROLES)[number];
export const ASSET = "TSC" as const;
export type ErrorResponse = {
  error: { code: string; message: string; correlationId: string };
};
