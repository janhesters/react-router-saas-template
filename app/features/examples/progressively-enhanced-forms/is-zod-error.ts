import type { ZodError } from 'zod';
import type * as z4 from 'zod/v4/core';

/**
 * Type guard to check if an error is a ZodError.
 *
 * @example
 * ```ts
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (isZodError(error)) {
 *     return json({ errors: error });
 *   }
 *   throw error;
 * }
 * ```
 */
export const isZodError = <T extends z4.$ZodObject>(
  error: unknown,
): error is ZodError<z4.output<T>> =>
  error !== null &&
  typeof error === 'object' &&
  'issues' in error &&
  Array.isArray(error.issues);
