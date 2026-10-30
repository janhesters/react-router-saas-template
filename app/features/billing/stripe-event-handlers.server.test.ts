import { DatabaseError } from "pg";
import Stripe from "stripe";
import type { Mock } from "vitest";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  createStripeCheckoutSessionCompletedEventFactory,
  createStripeCustomerCreatedEventFactory,
  createStripeCustomerDeletedEventFactory,
  createStripeCustomerSubscriptionCreatedEventFactory,
  createStripeCustomerSubscriptionDeletedEventFactory,
  createStripeCustomerSubscriptionUpdatedEventFactory,
  createStripeEventFactory,
  createStripePriceCreatedEventFactory,
  createStripePriceDeletedEventFactory,
  createStripePriceUpdatedEventFactory,
  createStripeProductCreatedEventFactory,
  createStripeProductDeletedEventFactory,
  createStripeProductUpdatedEventFactory,
  createStripeSubscriptionScheduleCreatedEventFactory,
  createStripeSubscriptionScheduleExpiringEventFactory,
  createStripeSubscriptionScheduleUpdatedEventFactory,
} from "./stripe-event-factories.server";
import {
  handleStripeChargeDisputeClosedEvent,
  handleStripeCheckoutSessionCompletedEvent,
  handleStripeCustomerCreatedEvent,
  handleStripeCustomerDeletedEvent,
  handleStripeCustomerSubscriptionCreatedEvent,
  handleStripeCustomerSubscriptionDeletedEvent,
  handleStripeCustomerSubscriptionUpdatedEvent,
  handleStripePriceCreatedEvent,
  handleStripePriceDeletedEvent,
  handleStripePriceUpdatedEvent,
  handleStripeProductCreatedEvent,
  handleStripeProductDeletedEvent,
  handleStripeProductUpdatedEvent,
  handleStripeSubscriptionScheduleCreatedEvent,
  handleStripeSubscriptionScheduleExpiringEvent,
  handleStripeSubscriptionScheduleUpdatedEvent,
} from "./stripe-event-handlers.server";
import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripePriceFactory,
  createStripeProductFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionScheduleFactory,
} from "./stripe-factories.server";
import { Prisma } from "~/generated/client";
import { captureConsole } from "~/test/console-test-utils";

// Every service the handlers reach is a mock, so no test touches a database,
// Stripe, or a client that connects when its module loads.
const mocks = vi.hoisted(() => ({
  cancelSubscription: vi.fn(),
  createStripeSubscriptionInDatabase: vi.fn(),
  deleteStripePriceFromDatabaseById: vi.fn(),
  deleteStripeProductFromDatabaseById: vi.fn(),
  findOrganization: vi.fn(),
  findSubscription: vi.fn(),
  listSubscriptions: vi.fn(),
  recordDeletedAccountsSubscription: vi.fn(),
  recordDeletedOrganizationCustomer: vi.fn(),
  retrieveCharge: vi.fn(),
  retrieveCustomer: vi.fn(),
  saveStripePriceFromAPIToDatabase: vi.fn(),
  saveStripeProductFromAPIToDatabase: vi.fn(),
  saveStripeSubscriptionScheduleFromAPIToDatabase: vi.fn(),
  updateCustomer: vi.fn(),
  updateOrganizationInDatabaseById: vi.fn(),
  updateOrganizations: vi.fn(),
  updateStripePriceFromAPIInDatabase: vi.fn(),
  updateStripeProductFromAPIInDatabase: vi.fn(),
  updateStripeSubscriptionFromAPIInDatabase: vi.fn(),
  updateStripeSubscriptionScheduleFromAPIInDatabase: vi.fn(),
  // Like the real lock once it holds the lock: run the callback.
  withOrganizationMutationLock: vi.fn(
    (_organizationId: string, operation: () => Promise<unknown>) => operation(),
  ),
}));

vi.mock("~/features/billing/stripe-admin.server", () => ({
  // The event factories only copy the version into each event.
  STRIPE_API_VERSION: "test-api-version",
  stripeAdmin: {
    charges: { retrieve: mocks.retrieveCharge },
    customers: {
      retrieve: mocks.retrieveCustomer,
      update: mocks.updateCustomer,
    },
    subscriptions: {
      cancel: mocks.cancelSubscription,
      list: mocks.listSubscriptions,
    },
  },
}));
vi.mock("~/utils/database.server", () => ({
  prisma: {
    organization: {
      findUnique: mocks.findOrganization,
      updateMany: mocks.updateOrganizations,
    },
    stripeSubscription: { findUnique: mocks.findSubscription },
  },
}));
vi.mock(
  "~/features/organizations/deletion/organization-mutation-lock.server",
  () => ({ withOrganizationMutationLock: mocks.withOrganizationMutationLock }),
);
vi.mock(
  "~/features/organizations/deletion/organization-deletion.server",
  () => ({
    recordDeletedOrganizationCustomer: mocks.recordDeletedOrganizationCustomer,
  }),
);
vi.mock("~/features/user-accounts/deletion/account-deletion.server", () => ({
  recordDeletedAccountsSubscription: mocks.recordDeletedAccountsSubscription,
}));
vi.mock("~/features/organizations/organizations-model.server", () => ({
  updateOrganizationInDatabaseById: mocks.updateOrganizationInDatabaseById,
}));
vi.mock("./stripe-prices-model.server", () => ({
  deleteStripePriceFromDatabaseById: mocks.deleteStripePriceFromDatabaseById,
  saveStripePriceFromAPIToDatabase: mocks.saveStripePriceFromAPIToDatabase,
  updateStripePriceFromAPIInDatabase: mocks.updateStripePriceFromAPIInDatabase,
}));
vi.mock("./stripe-product-model.server", () => ({
  deleteStripeProductFromDatabaseById:
    mocks.deleteStripeProductFromDatabaseById,
  saveStripeProductFromAPIToDatabase: mocks.saveStripeProductFromAPIToDatabase,
  updateStripeProductFromAPIInDatabase:
    mocks.updateStripeProductFromAPIInDatabase,
}));
vi.mock("./stripe-subscription-model.server", () => ({
  createStripeSubscriptionInDatabase: mocks.createStripeSubscriptionInDatabase,
  updateStripeSubscriptionFromAPIInDatabase:
    mocks.updateStripeSubscriptionFromAPIInDatabase,
}));
vi.mock("./stripe-subscription-schedule-model.server", () => ({
  saveStripeSubscriptionScheduleFromAPIToDatabase:
    mocks.saveStripeSubscriptionScheduleFromAPIToDatabase,
  updateStripeSubscriptionScheduleFromAPIInDatabase:
    mocks.updateStripeSubscriptionScheduleFromAPIInDatabase,
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

// Invented private details which must never reach a log.
const privateDetails = {
  address: "42 Sentinel Road, 3000 Sentinelburg",
  apiSecret: "sentinel-restricted-api-secret",
  email: "grace.sentinel@example.com",
  metadataSecret: "sentinel-metadata-secret",
  name: "Grace Sentinel",
  phone: "+41 79 555 01 23",
};
const privateMetadata = { internalNote: privateDetails.metadataSecret };

const expectNoPrivateDetails = (output: string) => {
  expect(
    Object.values(privateDetails).filter((value) => output.includes(value)),
  ).toEqual([]);
};

/** Every call to a mocked service, in order, as `[service, ...args]`. */
const processingCalls = () =>
  Object.entries(mocks as Record<string, Mock>)
    .flatMap(([name, mock]) =>
      mock.mock.calls.map((args, index) => ({
        call: [name, ...args],
        order: mock.mock.invocationCallOrder[index] ?? 0,
      })),
    )
    .toSorted((a, b) => a.order - b.order)
    .map(({ call }) => call);

// A Prisma error whose message and driver details quote a customer record.
const createDatabaseError = () =>
  new Prisma.PrismaClientKnownRequestError(
    `Unique constraint failed for ${privateDetails.email} (${privateDetails.name})`,
    {
      clientVersion: "7.10.1",
      code: "P2002",
      meta: {
        driverAdapterError: {
          cause: {
            detail: `Key (billing_email)=(${privateDetails.email}) already exists.`,
            originalMessage: `duplicate key value at ${privateDetails.address}`,
          },
        },
      },
    },
  );

// A PostgreSQL error from the lock connection which quotes a row.
const createLockError = () =>
  Object.assign(
    new DatabaseError(
      `could not lock the organization of ${privateDetails.name}`,
      0,
      "error",
    ),
    {
      detail: `Failing row contains (${privateDetails.email}, ${privateDetails.phone}).`,
      where: privateDetails.address,
    },
  );

// A Stripe SDK error whose message, raw response, and headers quote a customer.
const createStripeError = () =>
  new Stripe.errors.StripeInvalidRequestError({
    code: "resource_missing",
    headers: { authorization: `Bearer ${privateDetails.apiSecret}` },
    message: `No such customer: '${privateDetails.email}' (${privateDetails.name}, ${privateDetails.address})`,
    param: "email",
    requestId: "req_sentinel",
    statusCode: 404,
    type: "invalid_request_error",
  });

const acknowledged = { body: { message: "OK" }, status: 200 };
const retryRequested = {
  body: { message: "Webhook processing failed" },
  status: 500,
};

type FailureCase = {
  /**
   * Makes one service fail with `error` and returns the event, the handler
   * call, and the service calls expected up to and including the failure.
   */
  arrange: (error: unknown) => {
    event: Stripe.Event;
    expectedCalls: unknown[][];
    handle: () => Promise<Response>;
  };
  /** The fixed text of the catch's diagnostic. */
  description: string;
  /** The provider error this failure would raise. */
  error: () => unknown;
  name: string;
  response: typeof acknowledged;
};

const singleServiceFailure = <Event extends Stripe.Event>({
  argument,
  createEvent,
  description,
  handle,
  name,
  service,
}: {
  argument: (event: Event) => unknown;
  createEvent: () => Event;
  description: string;
  handle: (event: Event) => Promise<Response>;
  name: string;
  service: keyof typeof mocks;
}): FailureCase => ({
  arrange: (error) => {
    const event = createEvent();
    mocks[service].mockRejectedValue(error);
    return {
      event,
      expectedCalls: [[service, argument(event)]],
      handle: () => handle(event),
    };
  },
  description,
  error: createDatabaseError,
  name,
  response: acknowledged,
});

const chargeId = "ch_lost_dispute";
const createLostDisputeEvent = (): Stripe.ChargeDisputeClosedEvent => {
  // The repo has no dispute factory, and the handler reads only these fields.
  const dispute: Pick<
    Stripe.Dispute,
    "charge" | "id" | "metadata" | "object" | "status"
  > = {
    charge: chargeId,
    id: "dp_lost_dispute",
    metadata: privateMetadata,
    object: "dispute",
    status: "lost",
  };
  return {
    ...createStripeEventFactory(),
    data: { object: dispute as Stripe.Dispute },
    type: "charge.dispute.closed",
  };
};

const organizationId = "org_sentinel";
const createCompletedCheckoutEvent = () =>
  createStripeCheckoutSessionCompletedEventFactory({
    data: {
      object: createStripeCheckoutSessionFactory({
        customer: "cus_checkout",
        customer_details: {
          address: {
            city: "Sentinelburg",
            country: "CH",
            line1: privateDetails.address,
            line2: null,
            postal_code: "3000",
            state: null,
          },
          business_name: null,
          email: privateDetails.email,
          individual_name: null,
          name: privateDetails.name,
          phone: privateDetails.phone,
          tax_exempt: "none",
          tax_ids: [],
        },
        metadata: { ...privateMetadata, organizationId },
      }),
    },
  });

const createPrivateCustomer = () =>
  createStripeCustomerFactory({
    email: privateDetails.email,
    metadata: { ...privateMetadata, organizationId },
    name: privateDetails.name,
    phone: privateDetails.phone,
  });

const createPrivateSubscription = (metadata: Record<string, string>) =>
  createStripeSubscriptionFactory({
    customer: "cus_subscriber",
    metadata: { ...privateMetadata, ...metadata },
  });

const lockCall = [
  "withOrganizationMutationLock",
  organizationId,
  expect.any(Function),
];

const failureCases: FailureCase[] = [
  {
    arrange: (error) => {
      const event = createLostDisputeEvent();
      mocks.retrieveCharge.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [["retrieveCharge", chargeId]],
        handle: () => handleStripeChargeDisputeClosedEvent(event),
      };
    },
    description: "Error cancelling subscription on dispute.closed",
    error: createStripeError,
    name: "a lost dispute whose charge Stripe can't retrieve",
    response: acknowledged,
  },
  {
    arrange: (error) => {
      const event = createLostDisputeEvent();
      mocks.retrieveCharge.mockResolvedValue({
        customer: "cus_disputed",
        id: chargeId,
      });
      mocks.listSubscriptions.mockResolvedValue({
        data: [{ id: "sub_disputed" }],
      });
      mocks.cancelSubscription.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          ["retrieveCharge", chargeId],
          [
            "listSubscriptions",
            { customer: "cus_disputed", limit: 1, status: "active" },
          ],
          ["cancelSubscription", "sub_disputed"],
        ],
        handle: () => handleStripeChargeDisputeClosedEvent(event),
      };
    },
    description: "Error cancelling subscription on dispute.closed",
    error: createStripeError,
    name: "a lost dispute whose subscription Stripe can't cancel",
    response: acknowledged,
  },
  {
    arrange: (error) => {
      const event = createCompletedCheckoutEvent();
      mocks.withOrganizationMutationLock.mockRejectedValueOnce(error);
      return {
        event,
        expectedCalls: [lockCall],
        handle: () => handleStripeCheckoutSessionCompletedEvent(event),
      };
    },
    description: "Error handling Stripe checkout session completed event",
    error: createLockError,
    name: "a completed checkout whose organization lock fails",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createCompletedCheckoutEvent();
      mocks.recordDeletedOrganizationCustomer.mockResolvedValue(false);
      mocks.updateOrganizationInDatabaseById.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: "cus_checkout", organizationId },
          ],
          [
            "updateOrganizationInDatabaseById",
            {
              id: organizationId,
              organization: {
                billingEmail: privateDetails.email,
                stripeCustomerId: "cus_checkout",
                trialEnd: expect.any(Date),
              },
            },
          ],
        ],
        handle: () => handleStripeCheckoutSessionCompletedEvent(event),
      };
    },
    description: "Error handling Stripe checkout session completed event",
    error: createDatabaseError,
    name: "a completed checkout whose organization can't be updated",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createCompletedCheckoutEvent();
      mocks.recordDeletedOrganizationCustomer.mockResolvedValue(false);
      mocks.updateOrganizationInDatabaseById.mockResolvedValue({
        id: organizationId,
        name: privateDetails.name,
      });
      mocks.updateCustomer.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: "cus_checkout", organizationId },
          ],
          [
            "updateOrganizationInDatabaseById",
            {
              id: organizationId,
              organization: {
                billingEmail: privateDetails.email,
                stripeCustomerId: "cus_checkout",
                trialEnd: expect.any(Date),
              },
            },
          ],
          [
            "updateCustomer",
            "cus_checkout",
            { metadata: { organizationId }, name: privateDetails.name },
          ],
        ],
        handle: () => handleStripeCheckoutSessionCompletedEvent(event),
      };
    },
    description: "Error handling Stripe checkout session completed event",
    error: createStripeError,
    name: "a completed checkout whose Stripe customer can't be updated",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createStripeCustomerCreatedEventFactory({
        data: { object: createPrivateCustomer() },
      });
      mocks.recordDeletedOrganizationCustomer.mockResolvedValue(false);
      mocks.findOrganization.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: event.data.object.id, organizationId },
          ],
          [
            "findOrganization",
            {
              select: { stripeCustomerId: true },
              where: { id: organizationId },
            },
          ],
        ],
        handle: () => handleStripeCustomerCreatedEvent(event),
      };
    },
    description: "Error recording Stripe customer",
    error: createDatabaseError,
    name: "a created customer whose organization can't be read",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createStripeCustomerCreatedEventFactory({
        data: { object: createPrivateCustomer() },
      });
      mocks.recordDeletedOrganizationCustomer.mockResolvedValue(false);
      mocks.findOrganization.mockResolvedValue({ stripeCustomerId: null });
      mocks.retrieveCustomer.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: event.data.object.id, organizationId },
          ],
          [
            "findOrganization",
            {
              select: { stripeCustomerId: true },
              where: { id: organizationId },
            },
          ],
          [
            "retrieveCustomer",
            event.data.object.id,
            {},
            { maxNetworkRetries: 1, timeout: 20_000 },
          ],
        ],
        handle: () => handleStripeCustomerCreatedEvent(event),
      };
    },
    description: "Error recording Stripe customer",
    error: createStripeError,
    name: "a created customer whom Stripe can't retrieve",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createStripeCustomerCreatedEventFactory({
        data: { object: createPrivateCustomer() },
      });
      mocks.recordDeletedOrganizationCustomer.mockResolvedValue(false);
      mocks.findOrganization.mockResolvedValue({ stripeCustomerId: null });
      mocks.retrieveCustomer.mockResolvedValue(event.data.object);
      mocks.updateOrganizations.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: event.data.object.id, organizationId },
          ],
          [
            "findOrganization",
            {
              select: { stripeCustomerId: true },
              where: { id: organizationId },
            },
          ],
          [
            "retrieveCustomer",
            event.data.object.id,
            {},
            { maxNetworkRetries: 1, timeout: 20_000 },
          ],
          [
            "updateOrganizations",
            {
              data: { stripeCustomerId: event.data.object.id },
              where: { id: organizationId, stripeCustomerId: null },
            },
          ],
        ],
        handle: () => handleStripeCustomerCreatedEvent(event),
      };
    },
    description: "Error recording Stripe customer",
    error: createDatabaseError,
    name: "a created customer whose ID can't be saved",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createStripeCustomerDeletedEventFactory({
        data: { object: createPrivateCustomer() },
      });
      mocks.updateOrganizations.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "updateOrganizations",
            {
              data: { stripeCustomerId: null },
              where: {
                id: organizationId,
                stripeCustomerId: event.data.object.id,
              },
            },
          ],
        ],
        handle: () => handleStripeCustomerDeletedEvent(event),
      };
    },
    description: "Error handling Stripe customer deleted event",
    error: createDatabaseError,
    name: "a deleted customer whose organization can't be cleared",
    response: acknowledged,
  },
  {
    arrange: (error) => {
      const event = createStripeCustomerSubscriptionCreatedEventFactory({
        data: { object: createPrivateSubscription({ organizationId }) },
      });
      mocks.recordDeletedOrganizationCustomer.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: "cus_subscriber", organizationId },
          ],
        ],
        handle: () => handleStripeCustomerSubscriptionCreatedEvent(event),
      };
    },
    description: "Error creating Stripe subscription",
    error: createDatabaseError,
    name: "a created subscription whose deleted-organization check fails",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createStripeCustomerSubscriptionCreatedEventFactory({
        data: { object: createPrivateSubscription({ organizationId }) },
      });
      mocks.recordDeletedOrganizationCustomer.mockResolvedValue(false);
      mocks.findSubscription.mockResolvedValue(null);
      mocks.createStripeSubscriptionInDatabase.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: "cus_subscriber", organizationId },
          ],
          ["findSubscription", { where: { stripeId: event.data.object.id } }],
          ["createStripeSubscriptionInDatabase", event.data.object],
        ],
        handle: () => handleStripeCustomerSubscriptionCreatedEvent(event),
      };
    },
    description: "Error creating Stripe subscription",
    error: createDatabaseError,
    name: "a created subscription which can't be saved",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createStripeCustomerSubscriptionCreatedEventFactory({
        data: { object: createPrivateSubscription({ organizationId }) },
      });
      mocks.recordDeletedOrganizationCustomer.mockResolvedValue(false);
      mocks.findSubscription.mockResolvedValue(null);
      mocks.createStripeSubscriptionInDatabase.mockResolvedValue({
        organizationId,
        stripeId: event.data.object.id,
      });
      mocks.recordDeletedAccountsSubscription.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: "cus_subscriber", organizationId },
          ],
          ["findSubscription", { where: { stripeId: event.data.object.id } }],
          ["createStripeSubscriptionInDatabase", event.data.object],
          [
            "recordDeletedAccountsSubscription",
            { organizationId, subscriptionId: event.data.object.id },
          ],
        ],
        handle: () => handleStripeCustomerSubscriptionCreatedEvent(event),
      };
    },
    description: "Error creating Stripe subscription",
    error: createDatabaseError,
    name: "a created subscription whose deleted-account check fails",
    response: retryRequested,
  },
  singleServiceFailure({
    argument: (event) => event.data.object,
    createEvent: () =>
      createStripeCustomerSubscriptionDeletedEventFactory({
        data: { object: createPrivateSubscription({ organizationId }) },
      }),
    description: "Error updating deleted Stripe subscription",
    handle: handleStripeCustomerSubscriptionDeletedEvent,
    name: "a deleted subscription which can't be updated",
    service: "updateStripeSubscriptionFromAPIInDatabase",
  }),
  {
    arrange: (error) => {
      const event = createStripeCustomerSubscriptionUpdatedEventFactory({
        data: { object: createPrivateSubscription({ organizationId }) },
      });
      mocks.recordDeletedOrganizationCustomer.mockResolvedValue(false);
      mocks.findSubscription.mockResolvedValue({
        organizationId,
        stripeId: event.data.object.id,
      });
      mocks.updateStripeSubscriptionFromAPIInDatabase.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          lockCall,
          [
            "recordDeletedOrganizationCustomer",
            { customerId: "cus_subscriber", organizationId },
          ],
          ["findSubscription", { where: { stripeId: event.data.object.id } }],
          ["updateStripeSubscriptionFromAPIInDatabase", event.data.object],
        ],
        handle: () => handleStripeCustomerSubscriptionUpdatedEvent(event),
      };
    },
    description: "Error updating Stripe subscription",
    error: createDatabaseError,
    name: "an updated subscription which can't be saved",
    response: retryRequested,
  },
  {
    arrange: (error) => {
      const event = createStripeCustomerSubscriptionUpdatedEventFactory({
        data: { object: createPrivateSubscription({}) },
      });
      mocks.findSubscription.mockRejectedValue(error);
      return {
        event,
        expectedCalls: [
          ["findSubscription", { where: { stripeId: event.data.object.id } }],
        ],
        handle: () => handleStripeCustomerSubscriptionUpdatedEvent(event),
      };
    },
    description: "Error updating Stripe subscription",
    error: createDatabaseError,
    name: "an updated subscription without an organization which can't be read",
    response: retryRequested,
  },
  singleServiceFailure({
    argument: (event) => event.data.object,
    createEvent: () =>
      createStripePriceCreatedEventFactory({
        data: {
          object: createStripePriceFactory({ metadata: privateMetadata }),
        },
      }),
    description: "Error creating Stripe price",
    handle: handleStripePriceCreatedEvent,
    name: "a created price which can't be saved",
    service: "saveStripePriceFromAPIToDatabase",
  }),
  singleServiceFailure({
    argument: (event) => event.data.object.id,
    createEvent: () =>
      createStripePriceDeletedEventFactory({
        data: {
          object: createStripePriceFactory({ metadata: privateMetadata }),
        },
      }),
    description: "Error deleting Stripe price",
    handle: handleStripePriceDeletedEvent,
    name: "a deleted price which can't be removed",
    service: "deleteStripePriceFromDatabaseById",
  }),
  singleServiceFailure({
    argument: (event) => event.data.object,
    createEvent: () =>
      createStripePriceUpdatedEventFactory({
        data: {
          object: createStripePriceFactory({ metadata: privateMetadata }),
        },
      }),
    description: "Error updating Stripe price",
    handle: handleStripePriceUpdatedEvent,
    name: "an updated price which can't be saved",
    service: "updateStripePriceFromAPIInDatabase",
  }),
  singleServiceFailure({
    argument: (event) => event.data.object,
    createEvent: () =>
      createStripeProductCreatedEventFactory({
        data: {
          object: createStripeProductFactory({ metadata: privateMetadata }),
        },
      }),
    description: "Error creating Stripe product",
    handle: handleStripeProductCreatedEvent,
    name: "a created product which can't be saved",
    service: "saveStripeProductFromAPIToDatabase",
  }),
  singleServiceFailure({
    argument: (event) => event.data.object.id,
    createEvent: () =>
      createStripeProductDeletedEventFactory({
        data: {
          object: createStripeProductFactory({ metadata: privateMetadata }),
        },
      }),
    description: "Error deleting Stripe product",
    handle: handleStripeProductDeletedEvent,
    name: "a deleted product which can't be removed",
    service: "deleteStripeProductFromDatabaseById",
  }),
  singleServiceFailure({
    argument: (event) => event.data.object,
    createEvent: () =>
      createStripeProductUpdatedEventFactory({
        data: {
          object: createStripeProductFactory({ metadata: privateMetadata }),
        },
      }),
    description: "Error updating Stripe product",
    handle: handleStripeProductUpdatedEvent,
    name: "an updated product which can't be saved",
    service: "updateStripeProductFromAPIInDatabase",
  }),
  singleServiceFailure({
    argument: (event) => event.data.object,
    createEvent: () =>
      createStripeSubscriptionScheduleCreatedEventFactory({
        data: {
          object: createStripeSubscriptionScheduleFactory({
            metadata: privateMetadata,
          }),
        },
      }),
    description: "Error creating Stripe subscription schedule",
    handle: handleStripeSubscriptionScheduleCreatedEvent,
    name: "a created subscription schedule which can't be saved",
    service: "saveStripeSubscriptionScheduleFromAPIToDatabase",
  }),
  singleServiceFailure({
    argument: (event) => event.data.object,
    createEvent: () =>
      createStripeSubscriptionScheduleExpiringEventFactory({
        data: {
          object: createStripeSubscriptionScheduleFactory({
            metadata: privateMetadata,
          }),
        },
      }),
    description: "Error updating Stripe subscription schedule",
    handle: handleStripeSubscriptionScheduleExpiringEvent,
    name: "an expiring subscription schedule which can't be saved",
    service: "updateStripeSubscriptionScheduleFromAPIInDatabase",
  }),
  singleServiceFailure({
    argument: (event) => event.data.object,
    createEvent: () =>
      createStripeSubscriptionScheduleUpdatedEventFactory({
        data: {
          object: createStripeSubscriptionScheduleFactory({
            metadata: privateMetadata,
          }),
        },
      }),
    description: "Error updating Stripe subscription schedule",
    handle: handleStripeSubscriptionScheduleUpdatedEvent,
    name: "an updated subscription schedule which can't be saved",
    service: "updateStripeSubscriptionScheduleFromAPIInDatabase",
  }),
];

// Thrown values whose shape no handler can rely on.
const otherThrownValues: [string, () => unknown][] = [
  ["a string", () => `Could not save ${privateDetails.email}`],
  [
    "an object with a string message",
    () => ({
      message: `Could not save ${privateDetails.name}`,
      meta: { phone: privateDetails.phone },
    }),
  ],
  [
    "an object without a message",
    () => ({ code: "P2025", detail: { address: privateDetails.address } }),
  ],
  [
    "an error with a private cause and stack",
    () =>
      Object.assign(
        new Error("Webhook processing failed", {
          cause: createDatabaseError(),
        }),
        {
          stack: `Error: ${privateDetails.name}\n    at ${privateDetails.apiSecret}`,
        },
      ),
  ],
  [
    "a Stripe connection error with a private detail",
    () =>
      new Stripe.errors.StripeConnectionError({
        detail: new Error(`socket closed for ${privateDetails.email}`),
        message: "An error occurred with our connection to Stripe.",
      }),
  ],
  ["null", () => null],
  ["undefined", () => undefined],
  [
    "a circular object",
    () => {
      const value: Record<string, unknown> = {
        secret: privateDetails.apiSecret,
      };
      value.self = value;
      return value;
    },
  ],
];

// Loops instead of `test.each()`, which cuts long names short in test titles.
for (const mode of ["development", "production", "test"]) {
  describe(`Stripe event handler failures in ${mode} mode`, () => {
    for (const failureCase of failureCases) {
      test(`given: ${failureCase.name}, should: keep the response and log only its fixed description with the event's ID and type`, async () => {
        vi.stubEnv("NODE_ENV", mode);
        const logs = captureConsole();
        const { event, expectedCalls, handle } = failureCase.arrange(
          failureCase.error(),
        );

        const response = await handle();

        expect(response.status).toEqual(failureCase.response.status);
        expect(await response.json()).toEqual(failureCase.response.body);
        expect(processingCalls()).toEqual(expectedCalls);
        expectNoPrivateDetails(logs.output());
        expect(logs.calls).toEqual([
          [
            "error",
            failureCase.description,
            { id: event.id, type: event.type },
          ],
        ]);
      });
    }
  });
}

for (const [label, createThrownValue] of otherThrownValues) {
  describe(`Stripe event handler failures with ${label} thrown`, () => {
    for (const failureCase of failureCases) {
      test(`given: ${failureCase.name}, should: keep the response and log only its fixed description with the event's ID and type`, async () => {
        const logs = captureConsole();
        const { event, expectedCalls, handle } =
          failureCase.arrange(createThrownValue());

        const response = await handle();

        expect(response.status).toEqual(failureCase.response.status);
        expect(await response.json()).toEqual(failureCase.response.body);
        expect(processingCalls()).toEqual(expectedCalls);
        expectNoPrivateDetails(logs.output());
        expect(logs.calls).toEqual([
          [
            "error",
            failureCase.description,
            { id: event.id, type: event.type },
          ],
        ]);
      });
    }
  });
}

const unusableSummaryFields: [string, (event: Stripe.Event) => void][] = [
  [
    "an object ID with a private marker and no type",
    (event) => {
      Reflect.set(event, "id", { secret: privateDetails.apiSecret });
      Reflect.deleteProperty(event, "type");
    },
  ],
  [
    "no ID and a numeric type",
    (event) => {
      Reflect.deleteProperty(event, "id");
      Reflect.set(event, "type", 42);
    },
  ],
];

for (const [label, changeSummaryFields] of unusableSummaryFields) {
  describe(`Stripe event handler failures for an event with ${label}`, () => {
    for (const failureCase of failureCases) {
      test(`given: ${failureCase.name}, should: keep the response and log only its fixed description with an empty summary`, async () => {
        const logs = captureConsole();
        const { event, expectedCalls, handle } = failureCase.arrange(
          failureCase.error(),
        );
        changeSummaryFields(event);

        const response = await handle();

        expect(response.status).toEqual(failureCase.response.status);
        expect(await response.json()).toEqual(failureCase.response.body);
        expect(processingCalls()).toEqual(expectedCalls);
        expectNoPrivateDetails(logs.output());
        expect(logs.calls).toEqual([["error", failureCase.description, {}]]);
      });
    }
  });
}
