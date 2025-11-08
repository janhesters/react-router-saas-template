import crypto from "node:crypto";
import { PassThrough } from "node:stream";
import { contentSecurity } from "@nichtsam/helmet/content";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import type { EntryContext, RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";

import { getInstance } from "./features/localization/i18next-middleware.server";
import { init } from "./utils/env.server";
import { NonceProvider } from "./utils/nonce-provider";

init();

export const streamTimeout = 5000;

const oneSecond = 1000;
const nonceLength = 16;
const MODE = process.env.NODE_ENV ?? "development";

let mockServerInitialized = false;

async function initializeMockServer() {
  if (mockServerInitialized) {
    return;
  }

  if (process.env.SERVER_MOCKS === "true") {
    const { supabaseHandlers } = await import("~/test/mocks/handlers/supabase");
    const { resendHandlers } = await import("~/test/mocks/handlers/resend");
    const { stripeHandlers } = await import("~/test/mocks/handlers/stripe");
    const { startMockServer } = await import("~/test/mocks/server");
    startMockServer([
      ...supabaseHandlers,
      ...resendHandlers,
      ...stripeHandlers,
    ]);
  }

  mockServerInitialized = true;
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
  routerContext: RouterContextProvider,
) {
  await initializeMockServer();

  // Generate a cryptographically random nonce for this request
  const nonce = crypto.randomBytes(nonceLength).toString("hex");

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const userAgent = request.headers.get("user-agent");

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || entryContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + oneSecond,
    );

    const { pipe, abort } = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <I18nextProvider i18n={getInstance(routerContext)}>
          <ServerRouter
            context={entryContext}
            nonce={nonce}
            url={request.url}
          />
        </I18nextProvider>
      </NonceProvider>,
      {
        nonce,
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          // Configure Content Security Policy with the nonce
          contentSecurity(responseHeaders, {
            contentSecurityPolicy: {
              directives: {
                fetch: {
                  // Allow WebSocket connections in development for HMR
                  "connect-src": [
                    MODE === "development" ? "ws:" : undefined,
                    "'self'",
                  ],
                  "font-src": ["'self'"],
                  "frame-src": ["'self'"],
                  "img-src": [
                    "'self'",
                    "data:",
                    MODE === "test" ? "blob:" : undefined,
                  ],
                  // Script sources with nonce and strict-dynamic
                  "script-src": [
                    "'strict-dynamic'",
                    "'self'",
                    `'nonce-${nonce}'`,
                  ],
                  // Inline event handlers with nonce
                  "script-src-attr": [`'nonce-${nonce}'`],
                },
              },
              // Report-only in dev/test, enforce in production
              reportOnly: MODE !== "production",
            },
            crossOriginEmbedderPolicy: false,
          });

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onError(error: unknown) {
          const internalServerErrorStatusCode = 500;
          responseStatusCode = internalServerErrorStatusCode;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
        onShellError(error: unknown) {
          reject(error as Error);
        },
      },
    );
  });
}
