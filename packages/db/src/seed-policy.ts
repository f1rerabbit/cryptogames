export function assertSeedAllowed(nodeEnv: string | undefined) {
  if (nodeEnv !== "development" && nodeEnv !== "test")
    throw new Error("Seed is disabled outside development/test");
}
