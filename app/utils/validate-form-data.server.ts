import { parseFormData } from "@remix-run/form-data-parser";
import type { MultipartParserOptions } from "@remix-run/multipart-parser";
import type { ZodError, ZodType } from "zod";
import { z } from "zod";

import { badRequest } from "./http-responses.server";

type ValidationErrors = Record<string, { message: string }>;

export const processErrors = (error: ZodError): ValidationErrors => {
  const { formErrors, fieldErrors } = z.flattenError(error);

  // Collect only valid error objects.
  const errorObjects: Record<string, { message: string }>[] = [];

  // Add root error only if it exists.
  if (formErrors.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: The check above ensures that there is a root error
    errorObjects.push({ root: { message: formErrors[0]! } });
  }

  // Add field errors only if they exist.
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      errorObjects.push({ [field]: { message: String(messages[0]) } });
    }
  }

  // Merge all error objects into one.
  return errorObjects.reduce(
    // biome-ignore lint/performance/noAccumulatingSpread: We need to merge the error objects
    (accumulator, current) => ({ ...accumulator, ...current }),
    {},
  );
};

export async function validateFormData<T>(
  request: Request,
  schema: ZodType<T>,
  parserOptions?: MultipartParserOptions,
) {
  const formData = parserOptions
    ? await parseFormData(request, parserOptions)
    : await parseFormData(request);
  const values = Object.fromEntries(formData);
  const result = schema.safeParse(values);

  if (!result.success) {
    const errors = processErrors(result.error);
    throw badRequest({ errors });
  }

  return result.data;
}
