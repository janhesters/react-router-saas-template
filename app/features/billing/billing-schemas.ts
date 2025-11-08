import { z } from "zod";

import {
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  OPEN_CHECKOUT_SESSION_INTENT,
  RESUME_SUBSCRIPTION_INTENT,
  SWITCH_SUBSCRIPTION_INTENT,
  UPDATE_BILLING_EMAIL_INTENT,
  VIEW_INVOICES_INTENT,
} from "./billing-constants";

z.config({ jitless: true });

export const cancelSubscriptionSchema = z.object({
  intent: z.literal(CANCEL_SUBSCRIPTION_INTENT),
});

export const openCustomerCheckoutSessionSchema = z.object({
  intent: z.literal(OPEN_CHECKOUT_SESSION_INTENT),
  lookupKey: z.string(),
});

export const keepCurrentSubscriptionSchema = z.object({
  intent: z.literal(KEEP_CURRENT_SUBSCRIPTION_INTENT),
});

export const resumeSubscriptionSchema = z.object({
  intent: z.literal(RESUME_SUBSCRIPTION_INTENT),
});

export const switchSubscriptionSchema = z.object({
  intent: z.literal(SWITCH_SUBSCRIPTION_INTENT),
  lookupKey: z.string(),
});

export const updateBillingEmailSchema = z.object({
  billingEmail: z
    .email({
      message: "billing:billingPage.updateBillingEmailModal.emailInvalid",
    })
    .trim()
    .min(1, {
      message: "billing:billingPage.updateBillingEmailModal.emailRequired",
    }),
  intent: z.literal(UPDATE_BILLING_EMAIL_INTENT),
});

export const viewInvoicesSchema = z.object({
  intent: z.literal(VIEW_INVOICES_INTENT),
});

export type UpdateBillingEmailSchema = z.infer<typeof updateBillingEmailSchema>;
