import { z } from "zod";

import { CONTACT_SALES_INTENT } from "./contact-sales-constants";

z.config({ jitless: true });

export const contactSalesFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contactSales.companyNameRequired",
    })
    .max(255, {
      message: "billing:contactSales.companyNameTooLong",
    })
    .default(""),
  firstName: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contactSales.firstNameRequired",
    })
    .max(255, {
      message: "billing:contactSales.firstNameTooLong",
    })
    .default(""),
  intent: z.literal(CONTACT_SALES_INTENT),
  lastName: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contactSales.lastNameRequired",
    })
    .max(255, {
      message: "billing:contactSales.lastNameTooLong",
    })
    .default(""),
  message: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contactSales.messageRequired",
    })
    .max(5000, {
      message: "billing:contactSales.messageTooLong",
    })
    .default(""),
  phoneNumber: z
    .string()
    .trim()
    .min(1, {
      message: "billing:contactSales.phoneNumberRequired",
    })
    .default(""),
  workEmail: z
    .email({
      message: "billing:contactSales.workEmailInvalid",
    })
    .trim()
    .min(1, {
      message: "billing:contactSales.workEmailRequired",
    })
    .default(""),
});

export type ContactSalesFormSchema = z.infer<typeof contactSalesFormSchema>;
