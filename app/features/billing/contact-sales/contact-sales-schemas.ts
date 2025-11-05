import { z } from "zod";

import { CONTACT_SALES_INTENT } from "./contact-sales-constants";

z.config({ jitless: true });

export const contactSalesFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contact-sales.company-name-required",
    })
    .max(255, {
      message: "billing:contact-sales.company-name-too-long",
    }),
  firstName: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contact-sales.first-name-required",
    })
    .max(255, {
      message: "billing:contact-sales.first-name-too-long",
    }),
  intent: z.literal(CONTACT_SALES_INTENT),
  lastName: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contact-sales.last-name-required",
    })
    .max(255, {
      message: "billing:contact-sales.last-name-too-long",
    }),
  message: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contact-sales.message-required",
    })
    .max(5000, {
      message: "billing:contact-sales.message-too-long",
    }),
  phoneNumber: z.string().trim().min(1, {
    message: "billing:contact-sales.phone-number-required",
  }),
  workEmail: z
    .email({
      message: "billing:contact-sales.work-email-invalid",
    })
    .trim()
    .min(1, {
      message: "billing:contact-sales.work-email-required",
    }),
});

export type ContactSalesFormSchema = z.infer<typeof contactSalesFormSchema>;
