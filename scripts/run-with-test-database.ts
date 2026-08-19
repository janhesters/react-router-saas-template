import "dotenv/config";
import { spawn } from "node:child_process";

const [executable, ...args] = process.argv.slice(2);
const developmentDatabaseUrl = process.env.DATABASE_URL;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!executable) {
  throw new Error("Pass a command to run against the test database.");
}

if (!testDatabaseUrl) {
  throw new Error(
    "Set TEST_DATABASE_URL before running database-backed tests.",
  );
}

if (testDatabaseUrl === developmentDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL.");
}

let parsedUrl: URL;

try {
  parsedUrl = new URL(testDatabaseUrl);
} catch {
  throw new Error("TEST_DATABASE_URL must be a valid database URL.");
}
const databaseName = parsedUrl.pathname.slice(1);
const isLoopback = ["127.0.0.1", "::1", "localhost"].includes(
  parsedUrl.hostname,
);
const isPostgres = ["postgres:", "postgresql:"].includes(parsedUrl.protocol);

if (
  !isPostgres ||
  !isLoopback ||
  !databaseName.toLowerCase().includes("test")
) {
  throw new Error(
    "TEST_DATABASE_URL must point to a loopback Postgres database whose name contains 'test'.",
  );
}

const child = spawn(executable, args, {
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  stdio: "inherit",
});

const exitCode = await new Promise<number>((resolve, reject) => {
  child.on("error", reject);
  child.on("exit", (code, signal) => {
    if (signal) {
      reject(new Error(`Test command exited after receiving ${signal}.`));
      return;
    }

    resolve(code ?? 1);
  });
});

process.exit(exitCode);
