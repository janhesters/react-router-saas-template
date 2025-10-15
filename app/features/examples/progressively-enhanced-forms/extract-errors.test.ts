import { describe, expect, test } from 'vitest';
import { z, ZodError } from 'zod';

import { extractErrors } from './extract-errors';

describe('extractErrors()', () => {
  test('given: undefined, should: return undefined', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    const actual = extractErrors(undefined);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test('given: null, should: return undefined', () => {
    const actual = extractErrors(null);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test('given: a string, should: return undefined', () => {
    const actual = extractErrors('error');
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test('given: a number, should: return undefined', () => {
    const actual = extractErrors(123);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test('given: an object without errors property, should: return undefined', () => {
    const actual = extractErrors({ message: 'error' });
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test('given: an object with errors property, should: return the errors', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });

    if (!result.success) {
      const data = { errors: result.error };
      const actual = extractErrors(data);
      const expected = result.error;

      expect(actual).toEqual(expected);
    }
  });

  test('given: an object with ZodError from z.parse(), should: return the errors', () => {
    expect.assertions(1);

    const schema = z.object({ email: z.string().email() });

    try {
      schema.parse({ email: 'invalid' });
    } catch (error) {
      const data = { errors: error };
      const actual = extractErrors(data);
      const expected = error;

      expect(actual).toEqual(expected);
    }
  });

  test('given: an object with manually constructed ZodError, should: return the errors', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        path: ['name'],
        message: 'Expected string, received number',
      },
    ]);

    const data = { errors: zodError };
    const actual = extractErrors(data);
    const expected = zodError;

    expect(actual).toEqual(expected);
  });

  test('given: an object with other properties and errors, should: return only the errors', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        path: ['field'],
        message: 'Invalid type',
      },
    ]);

    const data = {
      message: 'Validation failed',
      status: 400,
      errors: zodError,
      timestamp: Date.now(),
    };

    const actual = extractErrors(data);
    const expected = zodError;

    expect(actual).toEqual(expected);
  });
});
