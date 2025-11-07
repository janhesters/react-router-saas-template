import { describe, expect, test } from "vitest";
import { z } from "zod";

import { validateFormData } from "./validate-form-data.server";

const createRequest = (formDataEntries: [string, string][]) => {
  const formData = new FormData();
  for (const [key, value] of formDataEntries) formData.append(key, value);

  return new Request("http://localhost", {
    body: formData,
    method: "POST",
  });
};

const registerIntents = {
  registerWithEmail: "registerWithEmail",
  registerWithGoogle: "registerWithGoogle",
} as const;

const registerWithEmailSchema = z.object({
  email: z.email(),
  intent: z.literal(registerIntents.registerWithEmail),
  username: z.string().min(3),
});

const registerWithGoogleSchema = z.object({
  intent: z.literal(registerIntents.registerWithGoogle),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" }),
});

const testSchema = z
  .discriminatedUnion("intent", [
    registerWithEmailSchema,
    registerWithGoogleSchema,
  ])
  .refine((data) => data.username !== "admin", {
    message: 'Username "admin" is reserved',
    path: [],
  });

describe("validateFormData()", () => {
  test("given: valid email registration data, should: return success with parsed data and submission", async () => {
    expect.assertions(4);

    const request = createRequest([
      ["intent", "registerWithEmail"],
      ["username", "john_doe"],
      ["email", "john@example.com"],
    ]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: "john@example.com",
        intent: "registerWithEmail",
        username: "john_doe",
      });
      expect(result.submission).toBeDefined();
      expect(result.submission.payload).toEqual({
        email: "john@example.com",
        intent: "registerWithEmail",
        username: "john_doe",
      });
    }
  });

  test("given: valid google registration data, should: return success with parsed data", async () => {
    expect.assertions(2);

    const request = createRequest([
      ["intent", "registerWithGoogle"],
      ["username", "john_doe"],
    ]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(true);
    if (result.success) {
      expect(result.data).toEqual({
        intent: "registerWithGoogle",
        username: "john_doe",
      });
    }
  });

  test("given: missing intent, should: return failure with badRequest response", async () => {
    expect.assertions(5);

    const request = createRequest([
      ["username", "john_doe"],
      ["email", "john@example.com"],
    ]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(false);
    if (!result.success) {
      expect(result.response).toBeDefined();
      expect(result.response.init?.status).toEqual(400);
      expect(result.response.data.result.error).toBeDefined();
      if (result.response.data.result.error) {
        expect(
          result.response.data.result.error.fieldErrors?.intent,
        ).toBeDefined();
      }
    }
  });

  test("given: reserved username, should: return failure with form-level error", async () => {
    expect.assertions(6);

    const request = createRequest([
      ["intent", "registerWithEmail"],
      ["username", "admin"],
      ["email", "john@example.com"],
    ]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(false);
    if (!result.success) {
      expect(result.response).toBeDefined();
      expect(result.response.init?.status).toEqual(400);
      expect(result.response.data.result.error).toBeDefined();
      // Form-level errors appear in formErrors array
      if (result.response.data.result.error) {
        expect(result.response.data.result.error.formErrors).toBeDefined();
        expect(result.response.data.result.error.formErrors[0]).toContain(
          'Username "admin" is reserved',
        );
      }
    }
  });

  test("given: email registration with invalid email, should: return failure with field error", async () => {
    expect.assertions(6);

    const request = createRequest([
      ["intent", "registerWithEmail"],
      ["username", "john_doe"],
      ["email", "not-an-email"],
    ]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(false);
    if (!result.success) {
      expect(result.response).toBeDefined();
      expect(result.response.init?.status).toEqual(400);
      expect(result.response.data.result.error).toBeDefined();
      if (result.response.data.result.error) {
        expect(
          result.response.data.result.error.fieldErrors?.email,
        ).toBeDefined();
        if (result.response.data.result.error.fieldErrors?.email) {
          expect(
            result.response.data.result.error.fieldErrors.email[0],
          ).toContain("Invalid email");
        }
      }
    }
  });

  test("given: google registration with short username, should: return failure with custom error message", async () => {
    expect.assertions(6);

    const request = createRequest([
      ["intent", "registerWithGoogle"],
      ["username", "jo"],
    ]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(false);
    if (!result.success) {
      expect(result.response).toBeDefined();
      expect(result.response.init?.status).toEqual(400);
      expect(result.response.data.result.error).toBeDefined();
      if (result.response.data.result.error) {
        expect(
          result.response.data.result.error.fieldErrors?.username,
        ).toBeDefined();
        if (result.response.data.result.error.fieldErrors?.username) {
          expect(
            result.response.data.result.error.fieldErrors.username[0],
          ).toContain("Username must be at least 3 characters long");
        }
      }
    }
  });

  test("given: multiple errors including reserved username, should: return failure with multiple errors", async () => {
    expect.assertions(6);

    const request = createRequest([
      ["intent", "registerWithEmail"],
      ["username", "admin"],
      ["email", "not-an-email"],
    ]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(false);
    if (!result.success) {
      expect(result.response).toBeDefined();
      expect(result.response.init?.status).toEqual(400);
      expect(result.response.data.result.error).toBeDefined();
      // Should have both email field error and form-level error
      if (result.response.data.result.error) {
        expect(
          result.response.data.result.error.fieldErrors?.email,
        ).toBeDefined();
        expect(result.response.data.result.error.formErrors[0]).toContain(
          'Username "admin" is reserved',
        );
      }
    }
  });

  test("given: valid data, should: preserve submission payload", async () => {
    expect.assertions(3);

    const request = createRequest([
      ["intent", "registerWithEmail"],
      ["username", "john_doe"],
      ["email", "john@example.com"],
    ]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(true);
    if (result.success) {
      expect(result.submission).toBeDefined();
      expect(result.submission.payload).toEqual({
        email: "john@example.com",
        intent: "registerWithEmail",
        username: "john_doe",
      });
    }
  });

  test("given: empty form data, should: return failure with validation errors", async () => {
    expect.assertions(4);

    const request = createRequest([]);

    const result = await validateFormData(request, testSchema);

    expect(result.success).toEqual(false);
    if (!result.success) {
      expect(result.response).toBeDefined();
      expect(result.response.init?.status).toEqual(400);
      expect(result.response.data.result.error).toBeDefined();
    }
  });
});
