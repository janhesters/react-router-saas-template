import { faker } from "@faker-js/faker";

import type { ContactSalesFormSchema } from "./contact-sales-schemas";
import type { Factory } from "~/utils/types";

/**
 * Creates a valid contact sales form submission body using Faker.
 *
 * @param overrides - Optional overrides for the default generated values.
 * @returns A populated object matching the ContactSalesFormSchema structure.
 */
export const createValidContactSalesFormData: Factory<
  Omit<ContactSalesFormSchema, "intent"> & { intent?: "contactSales" } // Allow overriding intent but default it later
> = (overrides = {}) => ({
  companyName: faker.company.name(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  message: faker.lorem.paragraph(),
  phoneNumber: faker.phone.number(),
  workEmail: faker.internet.email(),
  ...overrides, // Apply overrides
  intent: overrides.intent ?? "contactSales", // Ensure intent is 'contactSales' unless specifically overridden
});
