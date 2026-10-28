import { describe, expect, test } from "vitest";

import { getAllowedActionOrigins } from "./allowed-action-origins";

describe("getAllowedActionOrigins()", () => {
  test("given: no app URL, should: allow the local development host", () => {
    const actual = getAllowedActionOrigins();
    const expected = ["localhost:3000"];

    expect(actual).toEqual(expected);
  });

  test("given: an empty app URL, should: allow the local development host", () => {
    const actual = getAllowedActionOrigins({ appUrl: "" });
    const expected = ["localhost:3000"];

    expect(actual).toEqual(expected);
  });

  test.each([
    { appUrl: "https://app.example.com", expected: ["app.example.com"] },
    { appUrl: "https://app.example.com/", expected: ["app.example.com"] },
    {
      appUrl: "https://app.example.com:8443",
      expected: ["app.example.com:8443"],
    },
    { appUrl: "http://localhost:3010", expected: ["localhost:3010"] },
  ])(
    "given: the app URL $appUrl, should: allow its host including the port",
    ({ appUrl, expected }) => {
      const actual = getAllowedActionOrigins({ appUrl });

      expect(actual).toEqual(expected);
    },
  );

  test("given: additional hosts, should: allow them after the app URL's host", () => {
    const actual = getAllowedActionOrigins({
      additionalHosts: " www.example.com, my-app.fly.dev ,localhost:8443,",
      appUrl: "https://example.com",
    });
    const expected = [
      "example.com",
      "www.example.com",
      "my-app.fly.dev",
      "localhost:8443",
    ];

    expect(actual).toEqual(expected);
  });

  test("given: an additional host that repeats the app URL's host, should: list it once", () => {
    const actual = getAllowedActionOrigins({
      additionalHosts: "example.com",
      appUrl: "https://example.com",
    });
    const expected = ["example.com"];

    expect(actual).toEqual(expected);
  });

  test.each(["example.com", "/dashboard", "ftp://example.com", "https://"])(
    "given: the invalid app URL %s, should: fail with a clear message",
    (appUrl) => {
      expect(() => getAllowedActionOrigins({ appUrl })).toThrow(
        `APP_URL must be a full http or https URL with an explicit host, such as https://example.com. Received "${appUrl}".`,
      );
    },
  );

  test.each([
    "https://**",
    "https://%2A%2A",
    "https://*.example.com",
    "https://%2A.example.com",
  ])(
    "given: the app URL %s, whose host is a wildcard, should: fail with a clear message",
    (appUrl) => {
      expect(() => getAllowedActionOrigins({ appUrl })).toThrow(
        `APP_URL must be a full http or https URL with an explicit host, such as https://example.com. Received "${appUrl}".`,
      );
    },
  );

  test.each([
    "*",
    "**.example.com",
    "*.example.com",
    "%2A.example.com",
    "https://www.example.com",
    "www.example.com/path",
    "user@www.example.com",
    "WWW.EXAMPLE.COM",
  ])(
    "given: the additional host %s, which is not an explicit host, should: fail with a clear message",
    (host) => {
      expect(() =>
        getAllowedActionOrigins({
          additionalHosts: host,
          appUrl: "https://example.com",
        }),
      ).toThrow(
        `ADDITIONAL_ACTION_ORIGINS must list lowercase hosts without a scheme or wildcard, such as www.example.com or localhost:8443. Received "${host}".`,
      );
    },
  );
});
