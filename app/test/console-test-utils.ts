import { inspect } from "node:util";
import { vi } from "vitest";

const CONSOLE_METHODS = [
  "debug",
  "error",
  "info",
  "log",
  "trace",
  "warn",
] as const;

/**
 * Silences the console methods which write output and records their calls in
 * order as `[method, ...args]`. `output()` renders every recorded argument,
 * nested values included, so a test can prove a value never reached a log.
 * Restore the spies with `vi.restoreAllMocks()`.
 */
export function captureConsole() {
  const calls: unknown[][] = [];
  CONSOLE_METHODS.forEach((method) =>
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      calls.push([method, ...args]);
    }),
  );

  return {
    calls,
    output: () =>
      inspect(calls, {
        breakLength: Number.POSITIVE_INFINITY,
        depth: Number.POSITIVE_INFINITY,
        maxArrayLength: Number.POSITIVE_INFINITY,
        maxStringLength: Number.POSITIVE_INFINITY,
      }),
  };
}
