import type * as z4 from 'zod/v4/core';

type ExtractZodError<T> = T extends {
  errors: infer E extends z4.$ZodError<unknown>;
}
  ? E
  : undefined;

export function extractErrors<T>(
  data: T | undefined,
): ExtractZodError<T> | undefined {
  return data && typeof data === 'object' && 'errors' in data
    ? (data.errors as ExtractZodError<T>)
    : undefined;
}
