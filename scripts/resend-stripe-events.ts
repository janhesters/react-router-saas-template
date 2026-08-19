import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const eventIds = (await readFile("stripe-events.txt", "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.startsWith("evt_"));

if (eventIds.length === 0) {
  throw new Error("stripe-events.txt does not contain any Stripe event IDs.");
}

for (const eventId of eventIds) {
  const exitCode = await runStripe(["events", "resend", eventId]);

  if (exitCode !== 0) {
    throw new Error(`Stripe failed to resend ${eventId}.`);
  }
}

function runStripe(args: string[]) {
  const child = spawn("stripe", args, { stdio: "inherit" });

  return new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Stripe exited after receiving ${signal}.`));
        return;
      }

      resolve(code ?? 1);
    });
  });
}
