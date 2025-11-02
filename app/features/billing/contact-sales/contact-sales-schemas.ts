import type { FieldErrors } from "react-hook-form";
import { z } from "zod";

export const contactSalesFormSchema = z.object({
  companyName: z
    .string({
      error: "billing:contact-sales.company-name-required",
    })
    .min(1, "billing:contact-sales.company-name-required")
    .max(255, "billing:contact-sales.company-name-too-long"),
  firstName: z
    .string({
      error: "billing:contact-sales.first-name-required",
    })
    .min(1, "billing:contact-sales.first-name-required")
    .max(255, "billing:contact-sales.first-name-too-long"),
  intent: z.literal("contactSales"),
  lastName: z
    .string({
      error: "billing:contact-sales.last-name-required",
    })
    .min(1, "billing:contact-sales.last-name-required")
    .max(255, "billing:contact-sales.last-name-too-long"),
  message: z
    .string({
      error: "billing:contact-sales.message-required",
    })
    .min(1, "billing:contact-sales.message-required")
    .max(5000, "billing:contact-sales.message-too-long"),
  phoneNumber: z
    .string({
      error: "billing:contact-sales.phone-number-required",
    })
    .min(1, "billing:contact-sales.phone-number-required"),
  workEmail: z
    .email({
      error: "billing:contact-sales.work-email-invalid",
    })
    .min(1, "billing:contact-sales.work-email-required"),
});

export type ContactSalesFormSchema = z.infer<typeof contactSalesFormSchema>;
export type ContactSalesFormErrors = FieldErrors<ContactSalesFormSchema>;
