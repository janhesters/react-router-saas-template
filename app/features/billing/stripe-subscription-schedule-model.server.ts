import type { StripeSubscriptionSchedule } from "@prisma/client";
import type Stripe from "stripe";

import type { StripeSubscriptionScheduleWithPhasesAndPrice } from "./billing-factories.server";
import { prisma } from "~/utils/database.server";

/* CREATE */

/**
 * Saves a Stripe subscription schedule with its phases and prices to our database.
 *
 * @param stripeSchedule - Stripe.SubscriptionSchedule to save
 * @returns The saved StripeSubscriptionSchedule record
 */
export async function saveSubscriptionScheduleWithPhasesAndPriceToDatabase(
  stripeSchedule: StripeSubscriptionScheduleWithPhasesAndPrice,
) {
  return await prisma.stripeSubscriptionSchedule.create({
    data: {
      created: stripeSchedule.created,
      currentPhaseEnd: stripeSchedule.currentPhaseEnd,
      currentPhaseStart: stripeSchedule.currentPhaseStart,
      phases: {
        create: stripeSchedule.phases.map((phase) => ({
          endDate: phase.endDate,
          price: { connect: { stripeId: phase.price.stripeId } },
          quantity: phase.quantity,
          startDate: phase.startDate,
        })),
      },
      stripeId: stripeSchedule.stripeId,
      subscription: {
        connect: { stripeId: stripeSchedule.subscriptionId },
      },
    },
    include: { phases: true },
  });
}

/**
 * Creates a new Stripe subscription schedule in the database.
 *
 * @param stripeSchedule - Stripe.SubscriptionSchedule to create
 * @returns The created StripeSubscriptionSchedule record
 */
export async function saveStripeSubscriptionScheduleFromAPIToDatabase(
  stripeSchedule: Stripe.SubscriptionSchedule,
) {
  const createPhases = stripeSchedule.phases.map((phase) => {
    if (!phase.items?.[0]?.price || typeof phase.items[0].price !== "string") {
      throw new Error("Each phase must have at least one item with a price ID");
    }

    return {
      endDate: new Date(phase.end_date * 1000),
      price: {
        connect: { stripeId: phase.items[0].price },
      },
      quantity: phase.items[0].quantity ?? 1,
      startDate: new Date(phase.start_date * 1000),
    };
  });

  return prisma.stripeSubscriptionSchedule.create({
    data: {
      created: new Date(stripeSchedule.created * 1000),
      currentPhaseEnd: stripeSchedule.current_phase?.end_date
        ? new Date(stripeSchedule.current_phase.end_date * 1000)
        : null,
      currentPhaseStart: stripeSchedule.current_phase?.start_date
        ? new Date(stripeSchedule.current_phase.start_date * 1000)
        : null,
      phases: {
        create: createPhases,
      },
      stripeId: stripeSchedule.id,
      subscription: {
        connect: { stripeId: stripeSchedule.subscription as string },
      },
    },
    include: { phases: true },
  });
}

/* READ */

/**
 * Retrieves a Stripe subscription schedule from our database by its ID.
 *
 * @param scheduleId - The ID of the Stripe subscription schedule to retrieve
 * @returns The retrieved StripeSubscriptionSchedule record
 */
export async function retrieveStripeSubscriptionScheduleFromDatabaseById(
  scheduleId: StripeSubscriptionSchedule["stripeId"],
) {
  return await prisma.stripeSubscriptionSchedule.findUnique({
    where: { stripeId: scheduleId },
  });
}

/**
 * Retrieves a Stripe subscription schedule from our database by its ID.
 *
 * @param scheduleId - The ID of the Stripe subscription schedule to retrieve
 * @returns The retrieved StripeSubscriptionSchedule record
 */
export async function retrieveStripeSubscriptionScheduleWithPhasesFromDatabaseById(
  scheduleId: StripeSubscriptionSchedule["stripeId"],
) {
  return await prisma.stripeSubscriptionSchedule.findUnique({
    include: { phases: true },
    where: { stripeId: scheduleId },
  });
}

/* UPDATE */

/**
 * Updates an existing Stripe subscription schedule in the database.
 * All existing phases are deleted and replaced with new ones since
 * Stripe doesn't provide real IDs for phases.
 *
 * @param stripeSchedule - Stripe.SubscriptionSchedule to update
 * @returns The updated StripeSubscriptionSchedule record
 */
export async function updateStripeSubscriptionScheduleFromAPIInDatabase(
  stripeSchedule: Stripe.SubscriptionSchedule,
) {
  const createPhases = stripeSchedule.phases.map((phase) => {
    if (!phase.items?.[0]?.price || typeof phase.items[0].price !== "string") {
      throw new Error("Each phase must have at least one item with a price ID");
    }

    return {
      endDate: new Date(phase.end_date * 1000),
      price: {
        connect: { stripeId: phase.items[0].price },
      },
      quantity: phase.items[0].quantity ?? 1,
      startDate: new Date(phase.start_date * 1000),
    };
  });

  return prisma.stripeSubscriptionSchedule.update({
    data: {
      created: new Date(stripeSchedule.created * 1000),
      currentPhaseEnd: stripeSchedule.current_phase?.end_date
        ? new Date(stripeSchedule.current_phase.end_date * 1000)
        : null,
      currentPhaseStart: stripeSchedule.current_phase?.start_date
        ? new Date(stripeSchedule.current_phase.start_date * 1000)
        : null,
      phases: {
        // Then create new ones
        create: createPhases,
        // First delete all existing phases
        deleteMany: {},
      },
    },
    include: { phases: true },
    where: { stripeId: stripeSchedule.id },
  });
}

/* DELETE */

/**
 * Deletes a Stripe subscription schedule from our database.
 * This should be called after canceling a schedule in Stripe.
 *
 * @param scheduleId - The ID of the Stripe subscription schedule to delete
 * @returns The deleted StripeSubscriptionSchedule record
 */
export async function deleteStripeSubscriptionScheduleFromDatabaseById(
  scheduleId: StripeSubscriptionSchedule["stripeId"],
) {
  return prisma.stripeSubscriptionSchedule.delete({
    where: { stripeId: scheduleId },
  });
}
