import Stripe from "stripe";

// Why is this needed?
// See: https://github.com/nock/nock/issues/2785#issuecomment-2427076034
const isTestEnvironment = Boolean(process.env.MOCKS ?? process.env.VITEST);

/**
 * A passthrough wrapper around the global `fetch` function.
 *
 * This is necessary because passing `fetch` directly to
 * `Stripe.createFetchHttpClient` does not guarantee correct `this` binding
 * in all environments (such as Node.js or test runners).
 *
 * In particular, in certain test environments (e.g., using MSW, Nock, or when
 * mocks are applied), passing `fetch` point-free (i.e., just `fetch`) may
 * result in `this` being undefined, leading to unexpected errors like
 * `TypeError: Illegal invocation`.
 *
 * Wrapping `fetch` inside a new function (`passthroughFetch`) ensures:
 * - Correct argument forwarding
 * - Proper binding of `this` context (implicitly bound to `globalThis`)
 * - More predictable async behavior across environments
 *
 * See also: https://github.com/nock/nock/issues/2785#issuecomment-2427076034
 *
 * @param args - The arguments to pass to `fetch`, matching
 * `Parameters<typeof fetch>`.
 * @returns A `Promise<Response>` from calling the global `fetch`.
 */
const passthroughFetch = (...args: Parameters<typeof fetch>) => fetch(...args);

/**
 * The API version every request uses, independent of the account's default.
 *
 * It must equal the version this SDK release's types describe. Upgrading the
 * `stripe` package fails type checking here until you move this pin to the new
 * release's version and migrate the code that its changelog affects.
 *
 * See: https://docs.stripe.com/api/versioning
 */
export const STRIPE_API_VERSION = "2026-09-30.endive";

export const stripeAdmin = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
  httpClient: isTestEnvironment
    ? Stripe.createFetchHttpClient(passthroughFetch)
    : undefined,
});
