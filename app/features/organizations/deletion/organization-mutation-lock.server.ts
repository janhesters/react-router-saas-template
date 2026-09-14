import "dotenv/config";
import { Pool } from "pg";

declare global {
  var __organizationMutationLockPool: Pool | undefined;
}

function getLockPool() {
  if (!globalThis.__organizationMutationLockPool) {
    // Lock holders still need ordinary Prisma connections for their callback.
    // A separate bounded pool prevents lock waiters from exhausting that pool.
    const pool = new Pool({
      allowExitOnIdle: true,
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10_000,
      max: 4,
    });
    pool.on("error", (error) => {
      console.error("Organization lock connection failed", error);
    });
    globalThis.__organizationMutationLockPool = pool;
  }
  return globalThis.__organizationMutationLockPool;
}

/** Keep deletion exclusive while allowing concurrent image updates to use CAS. */
async function withMutationLock<T>(
  key: string,
  operation: () => Promise<T>,
  { shared = false }: { shared?: boolean } = {},
): Promise<T> {
  const client = await getLockPool().connect();
  let connectionError: Error | undefined;
  let discardConnection = false;
  const onConnectionError = (error: Error) => {
    connectionError = error;
  };
  client.on("error", onConnectionError);

  try {
    // Keep a real transaction open until the callback settles. An interactive
    // Prisma transaction would release its lock on timeout while the callback's
    // independent storage or database requests could still be running.
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query(
      shared
        ? "SELECT 1 FROM pg_advisory_xact_lock_shared(hashtextextended($1, 0))"
        : "SELECT 1 FROM pg_advisory_xact_lock(hashtextextended($1, 0))",
      [key],
    );
    if (connectionError) throw connectionError;

    const result = await operation();
    if (connectionError) throw connectionError;
    await client.query("COMMIT");
    return result;
  } catch (error) {
    if (!connectionError) {
      try {
        await client.query("ROLLBACK");
      } catch {
        discardConnection = true;
      }
    }
    throw error;
  } finally {
    client.removeListener("error", onConnectionError);
    client.release(discardConnection || connectionError !== undefined);
  }
}

export function withOrganizationMutationLock<T>(
  organizationId: string,
  operation: () => Promise<T>,
  options: { shared?: boolean } = {},
): Promise<T> {
  return withMutationLock(`organization:${organizationId}`, operation, options);
}

export function withAccountMutationLock<T>(
  supabaseUserId: string,
  operation: () => Promise<T>,
  options: { shared?: boolean } = {},
): Promise<T> {
  return withMutationLock(`account:${supabaseUserId}`, operation, options);
}
