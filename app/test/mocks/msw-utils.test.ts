import { once } from "node:events";
import { createServer } from "node:http";
import { setupServer } from "msw/node";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { onUnhandledFrame } from "./msw-utils";

const listenWithoutHandlers = () => {
  const server = setupServer();
  server.listen({ onUnhandledFrame });
  onTestFinished(() => server.close());
};

const spyOnWarnings = () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  onTestFinished(() => warn.mockRestore());
  return warn;
};

const startLocalServer = async (host: string) => {
  const localServer = createServer((_request, response) => {
    response.end("from the local server");
  });
  localServer.listen(0, host);
  await once(localServer, "listening");
  onTestFinished(() => {
    localServer.close();
  });
  const address = localServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("The local server must listen on a TCP port.");
  }
  return address.port;
};

// The callback only stays silent for `localhost`, so `127.0.0.1` stands in
// for an external host without leaving the machine.
describe("onUnhandledFrame()", () => {
  test("given: an unhandled request to another host, should: warn with only its method and path", async () => {
    const warn = spyOnWarnings();
    const port = await startLocalServer("127.0.0.1");
    listenWithoutHandlers();

    await fetch(`http://127.0.0.1:${port}/emails?token=query-secret`, {
      body: JSON.stringify({ to: "private-recipient@example.com" }),
      method: "POST",
    });
    const output = warn.mock.calls.flat().join("");

    expect(warn).toHaveBeenCalledTimes(1);
    expect(output).toContain(`POST http://127.0.0.1:${port}/emails\n`);
    expect(output).not.toContain("private-recipient@example.com");
    expect(output).not.toContain("query-secret");
  });

  test("given: an unhandled WebSocket connection to another host, should: warn with only its path", async () => {
    const warn = spyOnWarnings();
    const port = await startLocalServer("127.0.0.1");
    listenWithoutHandlers();

    const socket = new WebSocket(
      `ws://127.0.0.1:${port}/realtime?apikey=query-secret`,
    );
    await once(socket, "close");
    const output = warn.mock.calls.flat().join("");

    expect(warn).toHaveBeenCalledTimes(1);
    expect(output).toContain(`WebSocket ws://127.0.0.1:${port}/realtime\n`);
    expect(output).not.toContain("query-secret");
  });

  test("given: an unhandled request to localhost, should: pass it through without a warning", async () => {
    const warn = spyOnWarnings();
    const port = await startLocalServer("localhost");
    listenWithoutHandlers();

    const response = await fetch(`http://localhost:${port}/health`);

    expect(await response.text()).toEqual("from the local server");
    expect(warn).not.toHaveBeenCalled();
  });

  test("given: an unhandled WebSocket connection to localhost, should: pass it through without a warning", async () => {
    const warn = spyOnWarnings();
    const port = await startLocalServer("localhost");
    listenWithoutHandlers();

    const socket = new WebSocket(`ws://localhost:${port}/socket`);
    await once(socket, "close");

    expect(warn).not.toHaveBeenCalled();
  });
});
