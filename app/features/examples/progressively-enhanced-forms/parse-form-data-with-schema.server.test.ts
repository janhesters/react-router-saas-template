import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { toFormData } from '~/utils/to-form-data';

import { parseFormDataWithSchema } from './parse-form-data-with-schema.server';

const createRequest = (formData: FormData) =>
  new Request('http://localhost', {
    method: 'POST',
    body: formData,
  });

describe('parseFormDataWithSchema()', () => {
  test('given: valid form data with string fields, should: parse and return the data', async () => {
    const schema = z.object({
      username: z.string().min(3),
      email: z.email(),
    });

    const formData = toFormData({
      username: 'john_doe',
      email: 'john@example.com',
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      username: 'john_doe',
      email: 'john@example.com',
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with boolean fields (checked), should: parse as true', async () => {
    const schema = z.object({
      isActive: z.coerce.boolean(),
      hasPermission: z.coerce.boolean(),
    });

    const formData = new FormData();
    formData.append('isActive', 'on');
    formData.append('hasPermission', 'on');

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      isActive: true,
      hasPermission: true,
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with boolean fields (unchecked), should: default to false', async () => {
    const schema = z.object({
      username: z.string(),
      isActive: z.coerce.boolean(),
      hasPermission: z.coerce.boolean(),
    });

    const formData = toFormData({
      username: 'john_doe',
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      username: 'john_doe',
      isActive: false,
      hasPermission: false,
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with mixed checked and unchecked booleans, should: handle both correctly', async () => {
    const schema = z.object({
      emailNotificationComments: z.coerce.boolean(),
      emailNotificationFollowers: z.coerce.boolean(),
      emailNotificationProductUpdates: z.coerce.boolean(),
      emailNotificationSecurityAlerts: z.coerce.boolean(),
    });

    const formData = new FormData();
    formData.append('emailNotificationComments', 'on');
    formData.append('emailNotificationSecurityAlerts', 'on');

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      emailNotificationComments: true,
      emailNotificationFollowers: false,
      emailNotificationProductUpdates: false,
      emailNotificationSecurityAlerts: true,
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with array fields (multiple values), should: collect all values into an array', async () => {
    const schema = z.object({
      tags: z.array(z.string()),
      categories: z.array(z.string()),
    });

    const formData = toFormData({
      tags: ['react', 'typescript', 'testing'],
      categories: ['frontend', 'backend'],
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      tags: ['react', 'typescript', 'testing'],
      categories: ['frontend', 'backend'],
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with array fields (single value), should: return array with one item', async () => {
    const schema = z.object({
      tags: z.array(z.string()),
    });

    const formData = toFormData({
      tags: ['react'],
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      tags: ['react'],
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with array fields (no values), should: default to empty array', async () => {
    const schema = z.object({
      username: z.string(),
      notificationCategories: z.array(z.string()),
      tags: z.array(z.string()),
    });

    const formData = toFormData({
      username: 'john_doe',
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      username: 'john_doe',
      notificationCategories: [],
      tags: [],
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with enum fields, should: parse correctly', async () => {
    const schema = z.object({
      role: z.enum(['admin', 'user', 'guest']),
      status: z.enum(['active', 'inactive']),
    });

    const formData = toFormData({
      role: 'admin',
      status: 'active',
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      role: 'admin',
      status: 'active',
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with file field, should: parse file correctly', async () => {
    const oneMB = 1024 * 1024;
    const schema = z.object({
      avatar: z.file().max(oneMB),
    });

    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('avatar', file);

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);

    expect(actual.avatar).toBeInstanceOf(File);
    expect(actual.avatar).toEqual(
      expect.objectContaining({
        name: 'avatar.png',
        type: 'image/png',
        size: 7,
      }),
    );
  });

  test('given: form data with empty file field (required), should: remove empty file and fail validation', async () => {
    const oneMB = 1024 * 1024;
    const schema = z.object({
      username: z.string(),
      avatar: z.file().max(oneMB),
    });

    const emptyFile = new File([], '', { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('username', 'john_doe');
    formData.append('avatar', emptyFile);

    const request = createRequest(formData);

    // Empty file should be removed, causing required field validation to fail
    await expect(parseFormDataWithSchema(request, schema)).rejects.toThrow();
  });

  test('given: form data with empty file field (with MIME constraint), should: remove empty file to allow optional validation', async () => {
    const oneMB = 1024 * 1024;
    const schema = z.object({
      username: z.string(),
      avatar: z.union([z.file().max(oneMB).mime('image/*'), z.undefined()]),
    });

    // Simulate browser behavior: empty file input sends empty File object
    const emptyFile = new File([], '', { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('username', 'john_doe');
    formData.append('avatar', emptyFile);

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      username: 'john_doe',
      avatar: undefined,
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data without file field submitted (optional file), should: allow undefined', async () => {
    const oneMB = 1024 * 1024;
    const schema = z.object({
      username: z.string(),
      bio: z.string(),
      avatar: z.union([z.file().max(oneMB).mime('image/*'), z.undefined()]),
    });

    // No avatar field in form data at all
    const formData = toFormData({
      username: 'john_doe',
      bio: 'Software engineer',
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      username: 'john_doe',
      bio: 'Software engineer',
      avatar: undefined,
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with empty string for file field (parser behavior), should: remove empty string', async () => {
    const oneMB = 1024 * 1024;
    const schema = z.object({
      username: z.string(),
      avatar: z.union([z.file().max(oneMB).mime('image/*'), z.undefined()]),
    });

    // Simulate what @mjackson/form-data-parser does: converts empty file to empty string
    const formData = new FormData();
    formData.append('username', 'john_doe');
    formData.append('avatar', ''); // Parser converts empty File to ''

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      username: 'john_doe',
      avatar: undefined,
    };

    expect(actual).toEqual(expected);
  });

  test('given: complex form data with all field types, should: parse everything correctly', async () => {
    const oneMB = 1024 * 1024;
    const schema = z.object({
      username: z.string().min(3),
      email: z.email(),
      bio: z.string(),
      avatar: z.file().max(oneMB),
      country: z.enum(['US', 'DE', 'CH']),
      billingPlan: z.enum(['starter', 'pro', 'team']),
      notificationLevel: z.enum(['all', 'important', 'none']),
      emailNotificationComments: z.coerce.boolean(),
      emailNotificationFollowers: z.coerce.boolean(),
      notificationCategories: z.array(z.string()),
    });

    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('username', 'john_doe');
    formData.append('email', 'john@example.com');
    formData.append('bio', 'Software engineer');
    formData.append('avatar', file);
    formData.append('country', 'US');
    formData.append('billingPlan', 'pro');
    formData.append('notificationLevel', 'all');
    formData.append('emailNotificationComments', 'on');
    formData.append('notificationCategories', 'mentions');
    formData.append('notificationCategories', 'comments');

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);

    expect(actual.avatar).toBeInstanceOf(File);
    expect(actual).toEqual(
      expect.objectContaining({
        username: 'john_doe',
        email: 'john@example.com',
        bio: 'Software engineer',
        country: 'US',
        billingPlan: 'pro',
        notificationLevel: 'all',
        emailNotificationComments: true,
        emailNotificationFollowers: false,
        notificationCategories: ['mentions', 'comments'],
      }),
    );
  });

  test('given: invalid form data (validation error), should: throw ZodError', async () => {
    const schema = z.object({
      username: z.string().min(3),
      email: z.email(),
    });

    const formData = toFormData({
      username: 'jo',
      email: 'not-an-email',
    });

    const request = createRequest(formData);

    await expect(parseFormDataWithSchema(request, schema)).rejects.toThrow();
  });

  test('given: missing required field, should: throw ZodError', async () => {
    const schema = z.object({
      username: z.string().min(3),
      email: z.email(),
    });

    const formData = toFormData({
      username: 'john_doe',
    });

    const request = createRequest(formData);

    await expect(parseFormDataWithSchema(request, schema)).rejects.toThrow();
  });

  test('given: form data with empty string for required field, should: pass validation', async () => {
    const schema = z.object({
      username: z.string(),
      bio: z.string(),
    });

    const formData = toFormData({
      username: 'john_doe',
      bio: '',
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      username: 'john_doe',
      bio: '',
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with empty optional string field, should: validate successfully', async () => {
    const schema = z.object({
      username: z.string(),
      website: z.url().or(z.literal('')),
    });

    const formData = toFormData({
      username: 'john_doe',
      website: '',
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      username: 'john_doe',
      website: '',
    };

    expect(actual).toEqual(expected);
  });

  test('given: array field with boolean element type, should: handle correctly', async () => {
    const schema = z.object({
      permissions: z.array(z.string()),
    });

    const formData = toFormData({
      permissions: ['read', 'write', 'delete'],
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      permissions: ['read', 'write', 'delete'],
    };

    expect(actual).toEqual(expected);
  });

  test('given: form data with url field, should: parse correctly', async () => {
    const schema = z.object({
      website: z.url(),
    });

    const formData = toFormData({
      website: 'https://example.com',
    });

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      website: 'https://example.com',
    };

    expect(actual).toEqual(expected);
  });

  test('given: empty form data with only array and boolean fields in schema, should: default all correctly', async () => {
    const schema = z.object({
      isActive: z.coerce.boolean(),
      hasPermission: z.coerce.boolean(),
      tags: z.array(z.string()),
      categories: z.array(z.string()),
    });

    const formData = new FormData();

    const request = createRequest(formData);
    const actual = await parseFormDataWithSchema(request, schema);
    const expected = {
      isActive: false,
      hasPermission: false,
      tags: [],
      categories: [],
    };

    expect(actual).toEqual(expected);
  });
});
