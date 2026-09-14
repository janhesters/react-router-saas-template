import { processPendingOrganizationDeletions } from "./organization-deletion.server";

const POLL_INTERVAL_MS = 15_000;

declare global {
  var __organizationDeletionWorker: ReturnType<typeof setInterval> | undefined;
}

/** Start one durable-cleanup poller per server process, including after restart. */
export function startOrganizationDeletionWorker(): void {
  if (globalThis.__organizationDeletionWorker || process.env.VITEST) return;

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await processPendingOrganizationDeletions();
    } catch (error) {
      console.error("Organization cleanup will retry:", error);
    } finally {
      running = false;
    }
  };
  globalThis.__organizationDeletionWorker = setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
  globalThis.__organizationDeletionWorker.unref();
  void tick();
}
