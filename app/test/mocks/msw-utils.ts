import type { UnhandledFrameHandle, UnhandledFrameStrategy } from "msw";
import { HttpNetworkFrame, WebSocketNetworkFrame } from "msw/experimental";

type UnhandledFrameCallback = Exclude<
  UnhandledFrameHandle,
  UnhandledFrameStrategy
>;
type NetworkFrame = Parameters<UnhandledFrameCallback>[0]["frame"];

const getFrameTarget = (frame: NetworkFrame) => {
  if (frame instanceof HttpNetworkFrame) {
    const { method, url } = frame.data.request;
    return { kind: method, url: new URL(url) };
  }
  if (frame instanceof WebSocketNetworkFrame) {
    return { kind: "WebSocket", url: frame.data.connection.client.url };
  }
};

/**
 * Callback function to handle unhandled network frames (requests and
 * WebSocket connections) in MSW (Mock Service Worker).
 *
 * @param frame - The unhandled network frame.
 */
export const onUnhandledFrame: UnhandledFrameCallback = ({ frame }) => {
  const target = getFrameTarget(frame);

  // Opt out of requests to localhost on the client and server.
  if (target?.url.hostname === "localhost") {
    return;
  }

  // MSW's default warning appends the request body, and URL queries can carry
  // tokens. Name only the method and path, which is enough to add a handler.
  const description = target
    ? `${target.kind} ${target.url.origin}${target.url.pathname}`
    : `a ${frame.protocol} frame`;

  console.warn(
    "[MSW] Warning: captured a request without a matching request handler:\n\n",
    `  • ${description}\n\n`,
    "If you still wish to intercept this unhandled request, please create a request handler for it.\n",
    "Read more: https://mswjs.io/docs/getting-started/mocks",
  );
};
