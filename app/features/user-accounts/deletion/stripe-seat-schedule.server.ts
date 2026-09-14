import type Stripe from "stripe";

const stripeId = (resource: string | { id: string }): string =>
  typeof resource === "string" ? resource : resource.id;

function preserveDiscount(
  discount: Stripe.SubscriptionSchedule.Phase.Discount,
): Stripe.SubscriptionScheduleUpdateParams.Phase.Discount {
  // Reuse existing discounts so a seat retry does not restart coupon duration.
  if (discount.discount) return { discount: stripeId(discount.discount) };
  if (discount.promotion_code)
    return { promotion_code: stripeId(discount.promotion_code) };
  if (discount.coupon) return { coupon: stripeId(discount.coupon) };
  throw new Error("Schedule contains an invalid discount");
}

/**
 * Schedule updates replace current/future phases: send every configurable
 * attribute back to Stripe while changing only the template's seat item.
 * https://docs.stripe.com/billing/subscriptions/subscription-schedules#update-subscription-schedules
 */
export function preservePhaseWithSeatQuantity(
  phase: Stripe.SubscriptionSchedule.Phase,
  quantity: number,
): Stripe.SubscriptionScheduleUpdateParams.Phase {
  return {
    add_invoice_items: phase.add_invoice_items.map((item) => ({
      discountable: item.discountable ?? undefined,
      discounts: item.discounts.map(preserveDiscount),
      metadata: item.metadata ?? undefined,
      period: item.period,
      price: stripeId(item.price),
      quantity: item.quantity ?? undefined,
      tax_rates: item.tax_rates?.map(stripeId),
    })),
    application_fee_percent: phase.application_fee_percent ?? undefined,
    automatic_tax: phase.automatic_tax
      ? {
          enabled: phase.automatic_tax.enabled,
          liability: phase.automatic_tax.liability
            ? {
                account: phase.automatic_tax.liability.account
                  ? stripeId(phase.automatic_tax.liability.account)
                  : undefined,
                type: phase.automatic_tax.liability.type,
              }
            : undefined,
        }
      : undefined,
    billing_cycle_anchor: phase.billing_cycle_anchor ?? undefined,
    billing_thresholds: phase.billing_thresholds
      ? {
          amount_gte: phase.billing_thresholds.amount_gte ?? undefined,
          reset_billing_cycle_anchor:
            phase.billing_thresholds.reset_billing_cycle_anchor ?? undefined,
        }
      : undefined,
    collection_method: phase.collection_method ?? undefined,
    currency: phase.currency,
    default_payment_method: phase.default_payment_method
      ? stripeId(phase.default_payment_method)
      : undefined,
    default_tax_rates: phase.default_tax_rates?.map(stripeId),
    description: phase.description ?? undefined,
    discounts: phase.discounts.map(preserveDiscount),
    end_date: phase.end_date,
    invoice_settings: phase.invoice_settings
      ? {
          account_tax_ids:
            phase.invoice_settings.account_tax_ids?.map(stripeId),
          custom_fields: phase.invoice_settings.custom_fields ?? undefined,
          days_until_due: phase.invoice_settings.days_until_due ?? undefined,
          description: phase.invoice_settings.description ?? undefined,
          footer: phase.invoice_settings.footer ?? undefined,
          issuer: phase.invoice_settings.issuer
            ? {
                account: phase.invoice_settings.issuer.account
                  ? stripeId(phase.invoice_settings.issuer.account)
                  : undefined,
                type: phase.invoice_settings.issuer.type,
              }
            : undefined,
        }
      : undefined,
    items: phase.items.map((item, index) => ({
      billing_thresholds:
        item.billing_thresholds?.usage_gte == null
          ? undefined
          : { usage_gte: item.billing_thresholds.usage_gte },
      discounts: item.discounts.map(preserveDiscount),
      metadata: item.metadata ?? undefined,
      price: stripeId(item.price),
      quantity: index === 0 ? quantity : item.quantity,
      tax_rates: item.tax_rates?.map(stripeId),
    })),
    metadata: phase.metadata ?? undefined,
    on_behalf_of: phase.on_behalf_of ? stripeId(phase.on_behalf_of) : undefined,
    proration_behavior: phase.proration_behavior,
    start_date: phase.start_date,
    transfer_data: phase.transfer_data
      ? {
          amount_percent: phase.transfer_data.amount_percent ?? undefined,
          destination: stripeId(phase.transfer_data.destination),
        }
      : undefined,
    trial: phase.trial,
    trial_end: phase.trial_end ?? undefined,
  };
}
