import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import type { EntryContext, RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";

import { getInstance } from "./features/localization/i18n-middleware.server";
import { init } from "./utils/env.server";

init();

export const streamTimeout = 5000;

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

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const userAgent = request.headers.get("user-agent");

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || entryContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={getInstance(routerContext)}>
        <ServerRouter context={entryContext} url={request.url} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
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

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, streamTimeout + 1000);
  });
}
