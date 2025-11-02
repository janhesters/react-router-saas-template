import { data } from "react-router";

export type DataWithResponseInit<Data> = ReturnType<typeof data<Data>>;

/**
 * Returns a 201 Created response with optional data and headers.
 *
 * @param responseData - The data to return in the response body
 * @param init - Optional response init (headers, etc.) - status is always set to 201
 * @returns A Response object with status 201
 *
 * @example
 * ```ts
 * // Return created resource
 * return created({
 *   id: "123",
 *   name: "New Resource"
 * });
 *
 * // Return with custom headers
 * return created(
 *   { id: "123" },
 *   { headers: { "Location": "/api/resources/123" } }
 * );
 * ```
 */
export function created<T>(
  responseData: T,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<T>;
export function created(
  responseData?: undefined,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<Record<string, never>>;
export function created<T>(
  responseData?: T,
  init?: Omit<ResponseInit, "status">,
) {
  return data(responseData ?? {}, { ...init, status: 201 });
}

/**
 * Returns a 400 Bad Request response with optional data and headers.
 *
 * @param responseData - The data to return in the response body
 * @param init - Optional response init (headers, etc.) - status is always set to 400
 * @returns A Response object with status 400
 *
 * @example
 * ```ts
 * // Return validation errors
 * return badRequest({
 *   errors: {
 *     email: { message: "Invalid email" }
 *   }
 * });
 *
 * // Return with custom headers
 * return badRequest(
 *   { error: "Invalid request" },
 *   { headers: { "X-Custom": "value" } }
 * );
 * ```
 */
export function badRequest<T>(
  responseData: T,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<T>;
export function badRequest(
  responseData?: undefined,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<Record<string, never>>;
export function badRequest<T>(
  responseData?: T,
  init?: Omit<ResponseInit, "status">,
) {
  return data(responseData ?? {}, { ...init, status: 400 });
}

/**
 * Returns a 401 Unauthorized response with optional data and headers.
 *
 * @param responseData - The data to return in the response body
 * @param init - Optional response init (headers, etc.) - status is always set to 401
 * @returns A Response object with status 401
 *
 * @example
 * ```ts
 * // Return unauthorized error
 * return unauthorized({
 *   error: "Invalid credentials"
 * });
 *
 * // Return with custom headers
 * return unauthorized(
 *   { error: "Token expired" },
 *   { headers: { "WWW-Authenticate": "Bearer" } }
 * );
 * ```
 */
export function unauthorized<T>(
  responseData: T,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<T>;
export function unauthorized(
  responseData?: undefined,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<Record<string, never>>;
export function unauthorized<T>(
  responseData?: T,
  init?: Omit<ResponseInit, "status">,
) {
  return data(responseData ?? {}, { ...init, status: 401 });
}

/**
 * Returns a 403 Forbidden response with optional data and headers.
 *
 * @param responseData - The data to return in the response body
 * @param init - Optional response init (headers, etc.) - status is always set to 403
 * @returns A Response object with status 403
 *
 * @example
 * ```ts
 * // Return forbidden error
 * return forbidden({
 *   error: "Insufficient permissions"
 * });
 *
 * // Return with custom headers
 * return forbidden(
 *   { error: "Access denied" },
 *   { headers: { "X-Custom": "value" } }
 * );
 * ```
 */
export function forbidden<T>(
  responseData: T,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<T>;
export function forbidden(
  responseData?: undefined,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<Record<string, never>>;
export function forbidden<T>(
  responseData?: T,
  init?: Omit<ResponseInit, "status">,
) {
  return data(responseData ?? {}, { ...init, status: 403 });
}

/**
 * Returns a 404 Not Found response with optional data and headers.
 *
 * @param responseData - The data to return in the response body
 * @param init - Optional response init (headers, etc.) - status is always set to 404
 * @returns A Response object with status 404
 *
 * @example
 * ```ts
 * // Return not found error
 * return notFound({
 *   error: "Resource not found"
 * });
 *
 * // Return with custom headers
 * return notFound(
 *   { error: "User not found" },
 *   { headers: { "X-Custom": "value" } }
 * );
 * ```
 */
export function notFound<T>(
  responseData: T,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<T>;
export function notFound(
  responseData?: undefined,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<Record<string, never>>;
export function notFound<T>(
  responseData?: T,
  init?: Omit<ResponseInit, "status">,
) {
  return data(responseData ?? {}, { ...init, status: 404 });
}

/**
 * Returns a 405 Method Not Allowed response with optional data and headers.
 *
 * @param responseData - The data to return in the response body
 * @param init - Optional response init (headers, etc.) - status is always set to 405
 * @returns A Response object with status 405
 *
 * @example
 * ```ts
 * // Return method not allowed error
 * return methodNotAllowed({
 *   error: "POST not allowed",
 *   allowedMethods: ["GET", "PUT"]
 * });
 *
 * // Return with custom headers
 * return methodNotAllowed(
 *   { error: "Method not supported" },
 *   { headers: { "Allow": "GET, PUT" } }
 * );
 * ```
 */
export function methodNotAllowed<T>(
  responseData: T,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<T>;
export function methodNotAllowed(
  responseData?: undefined,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<Record<string, never>>;
export function methodNotAllowed<T>(
  responseData?: T,
  init?: Omit<ResponseInit, "status">,
) {
  return data(responseData ?? {}, { ...init, status: 405 });
}

/**
 * Returns a 409 Conflict response with optional data and headers.
 *
 * @param responseData - The data to return in the response body
 * @param init - Optional response init (headers, etc.) - status is always set to 409
 * @returns A Response object with status 409
 *
 * @example
 * ```ts
 * // Return conflict error
 * return conflict({
 *   error: "Resource already exists",
 *   resource: "user"
 * });
 *
 * // Return with custom headers
 * return conflict(
 *   { error: "Version conflict" },
 *   { headers: { "X-Conflict-Version": "1.2.3" } }
 * );
 * ```
 */
export function conflict<T>(
  responseData: T,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<T>;
export function conflict(
  responseData?: undefined,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<Record<string, never>>;
export function conflict<T>(
  responseData?: T,
  init?: Omit<ResponseInit, "status">,
) {
  return data(responseData ?? {}, { ...init, status: 409 });
}

/**
 * Returns a 429 Too Many Requests response with optional data and headers.
 *
 * @param responseData - The data to return in the response body
 * @param init - Optional response init (headers, etc.) - status is always set to 429
 * @returns A Response object with status 429
 *
 * @example
 * ```ts
 * // Return rate limit error
 * return tooManyRequests({
 *   error: "Rate limit exceeded",
 *   retryAfter: 60
 * });
 *
 * // Return with custom headers
 * return tooManyRequests(
 *   { error: "Too many requests" },
 *   { headers: { "Retry-After": "60" } }
 * );
 * ```
 */
export function tooManyRequests<T>(
  responseData: T,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<T>;
export function tooManyRequests(
  responseData?: undefined,
  init?: Omit<ResponseInit, "status">,
): DataWithResponseInit<Record<string, never>>;
export function tooManyRequests<T>(
  responseData?: T,
  init?: Omit<ResponseInit, "status">,
) {
  return data(responseData ?? {}, { ...init, status: 429 });
}
