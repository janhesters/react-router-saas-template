import { afterEach, describe, expect, test, vi } from "vitest";

import { createStripeCustomerDeletedEventFactory } from "./stripe-event-factories.server";
import { handleStripeCustomerDeletedEvent } from "./stripe-event-handlers.server";
import { createStripeCustomerFactory } from "./stripe-factories.server";
import { captureConsole } from "~/test/console-test-utils";

// Invented customer details which must never reach a log.
const privateDetails = {
  city: "Sentinelburg",
  email: "grace.sentinel@example.com",
  line1: "42 Sentinel Road",
  metadataSecret: "sentinel-customer-metadata-secret",
  name: "Grace Sentinel",
  phone: "+41 79 555 01 23",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("handleStripeCustomerDeletedEvent()", () => {
  test.each(["development", "production", "test"])(
    "given: a customer without an organization in %s mode, should: log only the event's ID and type",
    async (mode) => {
      vi.stubEnv("NODE_ENV", mode);
      const logs = captureConsole();
      const event = createStripeCustomerDeletedEventFactory({
        data: {
          object: createStripeCustomerFactory({
            address: {
              city: privateDetails.city,
              country: "CH",
              line1: privateDetails.line1,
              line2: null,
              postal_code: "3000",
              state: null,
            },
            email: privateDetails.email,
            metadata: { internalNote: privateDetails.metadataSecret },
            name: privateDetails.name,
            phone: privateDetails.phone,
          }),
        },
      });

      const response = await handleStripeCustomerDeletedEvent(event);

      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({ message: "OK" });
      const output = logs.output();
      for (const value of Object.values(privateDetails)) {
        expect(output).not.toContain(value);
      }
      expect(output).not.toContain(event.data.object.id);
      expect(logs.calls).toEqual([
        [
          "log",
          "unhandled Stripe event:",
          { id: event.id, type: "customer.deleted" },
        ],
      ]);
    },
  );
});
