import { processPendingAccountDeletions } from "./account-deletion.server";

const POLL_INTERVAL_MS = 15_000;

declare global {
  var __accountDeletionWorker: ReturnType<typeof setInterval> | undefined;
}

/** Resume durable account cleanup after each server restart. */
export function startAccountDeletionWorker(): void {
  if (globalThis.__accountDeletionWorker || process.env.VITEST) return;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await processPendingAccountDeletions();
    } catch (error) {
      console.error("Account cleanup will retry:", error);
    } finally {
      running = false;
    }
  };
  globalThis.__accountDeletionWorker = setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
  globalThis.__accountDeletionWorker.unref();
  void tick();
}
