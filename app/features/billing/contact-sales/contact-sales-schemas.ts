import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';

export const contactSalesFormSchema = z.object({
  firstName: z
    .string({
      error: 'billing:contact-sales.first-name-required',
    })
    .min(1, 'billing:contact-sales.first-name-required')
    .max(255, 'billing:contact-sales.first-name-too-long'),
  lastName: z
    .string({
      error: 'billing:contact-sales.last-name-required',
    })
    .min(1, 'billing:contact-sales.last-name-required')
    .max(255, 'billing:contact-sales.last-name-too-long'),
  companyName: z
    .string({
      error: 'billing:contact-sales.company-name-required',
    })
    .min(1, 'billing:contact-sales.company-name-required')
    .max(255, 'billing:contact-sales.company-name-too-long'),
  workEmail: z
    .email({
      error: 'billing:contact-sales.work-email-invalid',
    })
    .min(1, 'billing:contact-sales.work-email-required'),
  phoneNumber: z
    .string({
      error: 'billing:contact-sales.phone-number-required',
    })
    .min(1, 'billing:contact-sales.phone-number-required'),
  message: z
    .string({
      error: 'billing:contact-sales.message-required',
    })
    .min(1, 'billing:contact-sales.message-required')
    .max(5000, 'billing:contact-sales.message-too-long'),
  intent: z.literal('contactSales'),
});

export type ContactSalesFormSchema = z.infer<typeof contactSalesFormSchema>;
export type ContactSalesFormErrors = FieldErrors<ContactSalesFormSchema>;
