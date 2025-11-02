/** biome-ignore-all lint/style/noNonNullAssertion: test code */
import { describe, expect, test } from "vitest";

import { action } from "./contact-sales";
import { createValidContactSalesFormData } from "~/features/billing/contact-sales/contact-sales-factories.server";
import {
  deleteContactSalesFormSubmissionFromDatabaseById,
  retrieveContactSalesFormSubmissionsFromDatabase,
} from "~/features/billing/contact-sales/contact-sales-form-submission-model.server";
import { createTestContextProvider } from "~/test/test-utils";
import { badRequest } from "~/utils/http-responses.server";
import type { Payload } from "~/utils/to-form-data";
import { toFormData } from "~/utils/to-form-data";

const createUrl = () => `http://localhost:3000/contact-sales`;

const pattern = "/contact-sales";

async function sendRequest({ formData }: { formData: FormData }) {
  const request = new Request(createUrl(), {
    body: formData,
    method: "POST",
  });
  const params = {};

  return await action({
    context: await createTestContextProvider({ params, pattern, request }),
    params,
    request,
    unstable_pattern: pattern,
  });
}

describe("/contact-sales route action", () => {
  test("given: an invalid intent, should: return a 400 status code with an error message", async () => {
    // No factory needed here, intent is the only thing that matters
    const formData = toFormData({ intent: "invalid-intent" });

    const actual = await sendRequest({ formData });
    const expected = badRequest({
      errors: {
        intent: {
          message: "Invalid input",
        },
      },
    });

    expect(actual).toEqual(expected);
  });

  test("given: no intent, should: return a 400 status code with an error message", async () => {
    // No factory needed here
    const formData = toFormData({});

    const actual = await sendRequest({ formData });
    const expected = badRequest({
      errors: {
        intent: {
          message: "Invalid input",
        },
      },
    });

    expect(actual).toEqual(expected);
  });

  // Use test.each with the factory for invalid field tests
  test.each([
    {
      expected: badRequest({
        errors: {
          firstName: { message: "billing:contact-sales.first-name-required" },
        },
      }),
      given: "no first name",
      // Use factory and override the specific field to be invalid
      override: { firstName: "" }, // Or undefined, depending on schema handling. '' triggers min(1)
    },
    {
      expected: badRequest({
        errors: {
          lastName: { message: "billing:contact-sales.last-name-required" },
        },
      }),
      given: "no last name",
      override: { lastName: "" },
    },
    {
      expected: badRequest({
        errors: {
          companyName: {
            message: "billing:contact-sales.company-name-required",
          },
        },
      }),
      given: "no company name",
      override: { companyName: "" },
    },
    {
      expected: badRequest({
        errors: {
          workEmail: { message: "billing:contact-sales.work-email-invalid" },
        },
      }),
      given: "no work email",
      override: { workEmail: "" },
    },
    {
      expected: badRequest({
        errors: {
          workEmail: { message: "billing:contact-sales.work-email-invalid" },
        },
      }),
      given: "invalid work email",
      override: { workEmail: "invalid-email" },
    },
    {
      expected: badRequest({
        errors: {
          phoneNumber: {
            message: "billing:contact-sales.phone-number-required",
          },
        },
      }),
      given: "no phone number",
      override: { phoneNumber: "" },
    },
    {
      expected: badRequest({
        errors: {
          message: { message: "billing:contact-sales.message-required" },
        },
      }),
      given: "no message",
      override: { message: "" },
    },
    {
      expected: badRequest({
        errors: {
          firstName: { message: "billing:contact-sales.first-name-too-long" },
        },
      }),
      given: "first name too long",
      override: { firstName: "a".repeat(256) },
    },
    {
      expected: badRequest({
        errors: {
          message: { message: "billing:contact-sales.message-too-long" },
        },
      }),
      given: "message too long",
      override: { message: "a".repeat(5001) },
    },
    // Add other invalid cases using the same pattern
  ])(
    "given: $given, should: return a 400 status code with an error message",
    async ({ override, expected }) => {
      // Create base valid data and apply the specific override for this test case
      const body = createValidContactSalesFormData(override);
      const formData = toFormData(body as Payload);

      const actual = await sendRequest({ formData });
      expect(actual).toEqual(expected);
    },
  );

  test("given: honeypot field is filled, should: throw a 400 error", async () => {
    expect.assertions(3);

    const formData = toFormData({
      companyName: "Acme Inc",
      firstName: "John",
      from__confirm: "spam",
      intent: "contactSales",
      lastName: "Doe",
      message: "Test message",
      phoneNumber: "1234567890",
      workEmail: "john@acme.com",
    });

    try {
      await sendRequest({ formData });
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      if (error instanceof Response) {
        expect(error.status).toBe(400);
        expect(await error.text()).toBe("Form not submitted properly");
      }
    }
  });

  test("given: valid form submission with empty honeypot, should: save to database and return success", async () => {
    // Use the factory to generate valid data
    const validFormData = createValidContactSalesFormData();
    const formData = toFormData(validFormData as Payload);

    const actual = await sendRequest({ formData });
    const expected = { success: true };

    // Assert the action response
    expect(actual).toEqual(expected);

    // Verify the submission was saved to the database
    const submissions = await retrieveContactSalesFormSubmissionsFromDatabase();
    const savedSubmission = submissions.find(
      (sub) => sub.workEmail === validFormData.workEmail,
    );

    // Use expect.objectContaining or toMatchObject with the original valid data
    expect(savedSubmission).toMatchObject({
      companyName: validFormData.companyName,
      createdAt: expect.any(Date) as Date,
      // Match the data that was sent
      firstName: validFormData.firstName,
      // Also check for database-generated fields existence/type
      id: expect.any(String) as string,
      lastName: validFormData.lastName,
      message: validFormData.message,
      phoneNumber: validFormData.phoneNumber,
      updatedAt: expect.any(Date) as Date,
      workEmail: validFormData.workEmail,
    });

    await deleteContactSalesFormSubmissionFromDatabaseById(savedSubmission!.id);
  });
});
