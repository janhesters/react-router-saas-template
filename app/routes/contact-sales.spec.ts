/** biome-ignore-all lint/style/noNonNullAssertion: test code */
import { describe, expect, test } from "vitest";

import { action } from "./contact-sales";
import { CONTACT_SALES_INTENT } from "~/features/billing/contact-sales/contact-sales-constants";
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
  describe(`${CONTACT_SALES_INTENT} intent`, () => {
    const intent = CONTACT_SALES_INTENT;

    test.each([
      {
        body: { firstName: "", intent },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                firstName: ["billing:contactSales.firstNameRequired"],
              },
            },
          },
        }),
        given: "no first name",
      },
      {
        body: { ...createValidContactSalesFormData(), firstName: "", intent },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                firstName: ["billing:contactSales.firstNameRequired"],
              },
            },
          },
        }),
        given: "empty first name",
      },
      {
        body: { ...createValidContactSalesFormData(), intent, lastName: "" },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                lastName: ["billing:contactSales.lastNameRequired"],
              },
            },
          },
        }),
        given: "empty last name",
      },
      {
        body: { ...createValidContactSalesFormData(), companyName: "", intent },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                companyName: ["billing:contactSales.companyNameRequired"],
              },
            },
          },
        }),
        given: "empty company name",
      },
      {
        body: { ...createValidContactSalesFormData(), intent, workEmail: "" },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                workEmail: [
                  "billing:contactSales.workEmailInvalid",
                  "billing:contactSales.workEmailRequired",
                ],
              },
            },
          },
        }),
        given: "empty work email",
      },
      {
        body: {
          ...createValidContactSalesFormData(),
          intent,
          workEmail: "invalid-email",
        },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                workEmail: ["billing:contactSales.workEmailInvalid"],
              },
            },
          },
        }),
        given: "invalid work email",
      },
      {
        body: { ...createValidContactSalesFormData(), intent, phoneNumber: "" },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                phoneNumber: ["billing:contactSales.phoneNumberRequired"],
              },
            },
          },
        }),
        given: "empty phone number",
      },
      {
        body: { ...createValidContactSalesFormData(), intent, message: "" },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                message: ["billing:contactSales.messageRequired"],
              },
            },
          },
        }),
        given: "empty message",
      },
      {
        body: {
          ...createValidContactSalesFormData(),
          firstName: "a".repeat(256),
          intent,
        },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                firstName: ["billing:contactSales.firstNameTooLong"],
              },
            },
          },
        }),
        given: "first name too long",
      },
      {
        body: {
          ...createValidContactSalesFormData(),
          intent,
          message: "a".repeat(5001),
        },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                message: ["billing:contactSales.messageTooLong"],
              },
            },
          },
        }),
        given: "message too long",
      },
    ])(
      "given: $given, should: return a 400 status code with an error message",
      async ({ body, expected }) => {
        const formData = toFormData(body as Payload);

        const actual = await sendRequest({ formData });

        expect(actual).toMatchObject(expected);
      },
    );

    test("given: honeypot field is filled, should: throw a 400 error", async () => {
      const formData = toFormData({
        companyName: "Acme Inc",
        firstName: "John",
        from__confirm: "spam",
        intent,
        lastName: "Doe",
        message: "Test message",
        phoneNumber: "1234567890",
        workEmail: "john@acme.com",
      });

      await expect(sendRequest({ formData })).rejects.toThrow();
    });

    test("given: valid form submission with empty honeypot, should: save to database and return success", async () => {
      const validFormData = createValidContactSalesFormData();
      const formData = toFormData(validFormData as Payload);

      const actual = await sendRequest({ formData });

      expect(actual).toMatchObject({
        data: {
          result: undefined,
          success: true,
        },
      });

      // Verify the submission was saved to the database
      const submissions =
        await retrieveContactSalesFormSubmissionsFromDatabase();
      const savedSubmission = submissions.find(
        (sub) => sub.workEmail === validFormData.workEmail,
      );

      expect(savedSubmission).toMatchObject({
        companyName: validFormData.companyName,
        createdAt: expect.any(Date) as Date,
        firstName: validFormData.firstName,
        id: expect.any(String) as string,
        lastName: validFormData.lastName,
        message: validFormData.message,
        phoneNumber: validFormData.phoneNumber,
        updatedAt: expect.any(Date) as Date,
        workEmail: validFormData.workEmail,
      });

      await deleteContactSalesFormSubmissionFromDatabaseById(
        savedSubmission!.id,
      );
    });
  });
});
