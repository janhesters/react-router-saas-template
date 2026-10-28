/**
 * A TLS-terminating reverse proxy that serves the app the way Fly.io does in
 * production: browsers speak HTTPS to the proxy, and the proxy forwards plain
 * HTTP to the app with the original `Host` header plus
 * `X-Forwarded-Proto: https`.
 *
 * Usage: bun playwright/tls-terminating-proxy.ts --port 8443 --target http://localhost:3000
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

function createSelfSignedCertificate() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "tls-proxy-"));
  const certPath = path.join(directory, "cert.pem");
  const keyPath = path.join(directory, "key.pem");

  try {
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-days",
        "1",
        "-subj",
        "/CN=localhost",
        "-keyout",
        keyPath,
        "-out",
        certPath,
      ],
      { stdio: "ignore" },
    );

    return { cert: readFileSync(certPath), key: readFileSync(keyPath) };
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

const { values } = parseArgs({
  options: {
    port: { type: "string" },
    target: { type: "string" },
  },
});

if (!values.port || !values.target) {
  throw new Error(
    "Usage: bun playwright/tls-terminating-proxy.ts --port <port> --target <url>",
  );
}

const port = Number(values.port);
const target = new URL(values.target);

https
  .createServer(createSelfSignedCertificate(), (request, response) => {
    const upstreamRequest = http.request(
      {
        headers: { ...request.headers, "x-forwarded-proto": "https" },
        hostname: target.hostname,
        method: request.method,
        path: request.url,
        port: target.port,
      },
      (upstreamResponse) => {
        response.writeHead(
          upstreamResponse.statusCode ?? 502,
          upstreamResponse.headers,
        );
        upstreamResponse.pipe(response);
      },
    );

    upstreamRequest.on("error", () => {
      if (!response.headersSent) {
        response.writeHead(502);
      }

      response.end();
    });

    request.pipe(upstreamRequest);
  })
  .listen(port);
