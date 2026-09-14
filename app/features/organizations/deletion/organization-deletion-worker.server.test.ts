import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { startOrganizationDeletionWorker } from "./organization-deletion-worker.server";
import { processPendingOrganizationDeletions } from "./organization-deletion.server";

vi.mock("./organization-deletion.server", () => ({
  processPendingOrganizationDeletions: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("VITEST", "");
  vi.mocked(processPendingOrganizationDeletions).mockResolvedValue(undefined);
});

afterEach(() => {
  clearInterval(globalThis.__organizationDeletionWorker);
  globalThis.__organizationDeletionWorker = undefined;
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

test("given: a newly started server, should: resume persisted cleanup immediately and on subsequent polls", async () => {
  startOrganizationDeletionWorker();

  expect(processPendingOrganizationDeletions).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(15_000);
  expect(processPendingOrganizationDeletions).toHaveBeenCalledTimes(2);
});

test("given: an active worker and a slow provider, should: avoid duplicate timers and overlapping batches", async () => {
  let finish: (() => void) | undefined;
  vi.mocked(processPendingOrganizationDeletions).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  startOrganizationDeletionWorker();
  startOrganizationDeletionWorker();

  await vi.advanceTimersByTimeAsync(45_000);
  expect(processPendingOrganizationDeletions).toHaveBeenCalledTimes(1);
  finish?.();
  await vi.advanceTimersByTimeAsync(15_000);
  expect(processPendingOrganizationDeletions).toHaveBeenCalledTimes(2);
});

test("given: a failed cleanup batch, should: log the failure and resume on the next poll", async () => {
  const error = new Error("Database unavailable");
  const logger = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(processPendingOrganizationDeletions).mockRejectedValueOnce(error);
  startOrganizationDeletionWorker();

  await vi.advanceTimersByTimeAsync(15_000);
  expect(logger).toHaveBeenCalledWith(
    "Organization cleanup will retry:",
    error,
  );
  expect(processPendingOrganizationDeletions).toHaveBeenCalledTimes(2);
});
