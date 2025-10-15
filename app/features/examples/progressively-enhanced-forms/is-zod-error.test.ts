import { describe, expect, test } from 'vitest';
import { z, ZodError } from 'zod';

import { isZodError } from './is-zod-error';

describe('isZodError()', () => {
  test('given: a ZodError from z.parse(), should: return true', () => {
    expect.assertions(1);

    const schema = z.object({ name: z.string() });

    try {
      schema.parse({ name: 123 });
    } catch (error) {
      const actual = isZodError(error);
      const expected = true;

      expect(actual).toEqual(expected);
    }
  });

  test('given: a ZodError from safeParse(), should: return true', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });

    if (!result.success) {
      const actual = isZodError(result.error);
      const expected = true;

      expect(actual).toEqual(expected);
    }
  });

  test('given: a regular Error, should: return false', () => {
    const error = new Error('Something went wrong');

    const actual = isZodError(error);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: null, should: return false', () => {
    const actual = isZodError(null);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: undefined, should: return false', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    const actual = isZodError(undefined);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: a string, should: return false', () => {
    const actual = isZodError('error');
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: an object without issues, should: return false', () => {
    const actual = isZodError({ message: 'error' });
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: an object with non-array issues, should: return false', () => {
    const actual = isZodError({ issues: 'not an array' });
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: a manually constructed ZodError, should: return true', () => {
    const error = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        path: ['name'],
        message: 'Expected string, received number',
      },
    ]);

    const actual = isZodError(error);
    const expected = true;

    expect(actual).toEqual(expected);
  });
});
