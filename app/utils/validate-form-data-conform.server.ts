import { parseSubmission, report } from "@conform-to/react/future";
import { parseFormData } from "@remix-run/form-data-parser";
import type { MultipartParserOptions } from "@remix-run/multipart-parser";
import type * as z from "zod";

import { badRequest } from "./http-responses.server";

/**
 * Validates form data from a request using a Zod schema.
 *
 * @param request - The HTTP request containing the form data to validate
 * @param schema - A Zod schema to validate the form data against
 * @param parserOptions - Optional multipart parser options for handling file
 * uploads
 * @returns A result object with either `{ success: true, data: T, submission: Submission }` on success
 * or `{ success: false, response: Response }` on validation failure
 *
 * @example
 * ```ts
 * import { z } from "zod";
 *
 * const loginSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 *
 * export async function action({ request }: Route.ActionArgs) {
 *   const result = await validateFormData(request, loginSchema);
 *
 *   if (!result.success) {
 *     // Returns a 400 response with validation errors
 *     return result.response;
 *   }
 *
 *   // Type-safe access to validated data
 *   const { email, password } = result.data;
 *
 *   // Process the validated data and return ...
 * }
 * ```
 */
export async function validateFormData<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
  parserOptions?: MultipartParserOptions,
) {
  const formData = parserOptions
    ? await parseFormData(request, parserOptions)
    : await parseFormData(request);
  const submission = parseSubmission(formData);
  const result = await schema.safeParseAsync(submission.payload);

  if (!result.success) {
    /**
     * You might be asking, why not `throw` here? When you `throw` the response,
     * the `actionData` prop or `useActionData` hook will NOT be able to infer
     * the TypeScript types correctly.
     */
    return {
      response: badRequest({
        result: report(submission, {
          error: { issues: result.error.issues },
        }),
      }),
      success: false as const,
    };
  }

  return { data: result.data, submission, success: true as const };
}
