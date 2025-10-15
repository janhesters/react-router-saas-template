import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { getSchemaStructure } from './get-schema-structure.server';

describe('getSchemaStructure()', () => {
  test('given: schema with basic string fields, should: identify them as string type', () => {
    const schema = z.object({
      name: z.string(),
      description: z.string().min(10),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      name: 'string',
      description: 'string',
    };

    expect(actual).toEqual(expected);
  });

  test('given: schema with email fields, should: identify them as email type', () => {
    const schema = z.object({
      email: z.email(),
      username: z.string(),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      email: 'email',
      username: 'string',
    };

    expect(actual).toEqual(expected);
  });

  test('given: schema with url fields, should: identify them as url type', () => {
    const schema = z.object({
      website: z.url(),
      homepage: z.url(),
      name: z.string(),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      website: 'url',
      homepage: 'url',
      name: 'string',
    };

    expect(actual).toEqual(expected);
  });

  test('given: schema with boolean fields, should: identify them as boolean type', () => {
    const schema = z.object({
      isActive: z.boolean(),
      hasPermission: z.boolean(),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      isActive: 'boolean',
      hasPermission: 'boolean',
    };

    expect(actual).toEqual(expected);
  });

  test('given: schema with enum fields, should: identify them as enum type', () => {
    const schema = z.object({
      role: z.enum(['admin', 'user', 'guest']),
      status: z.enum(['active', 'inactive']),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      role: 'enum',
      status: 'enum',
    };

    expect(actual).toEqual(expected);
  });

  test('given: schema with file fields, should: identify them as file type', () => {
    const schema = z.object({
      avatar: z.file(),
      document: z.file().max(1024 * 1024),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      avatar: 'file',
      document: 'file',
    };

    expect(actual).toEqual(expected);
  });

  test('given: schema with array fields, should: identify them with correct element types', () => {
    const schema = z.object({
      tags: z.array(z.string()),
      ids: z.array(z.string()),
      categories: z.array(z.string()),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      tags: 'string[]',
      ids: 'string[]',
      categories: 'string[]',
    };

    expect(actual).toEqual(expected);
  });

  test('given: schema with optional fields (union with undefined), should: extract the non-undefined type', () => {
    const oneMB = 1024 * 1024;
    const schema = z.object({
      avatar: z.union([z.file().max(oneMB), z.undefined()]),
      nickname: z.union([z.string(), z.undefined()]),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      avatar: 'file',
      nickname: 'string',
    };

    expect(actual).toEqual(expected);
  });

  test('given: complex schema with all field types, should: correctly identify all types', () => {
    const oneMB = 1024 * 1024;
    const twoMB = 2 * oneMB;

    const schema = z.object({
      username: z.string().min(3).max(32),
      bio: z.string(),
      avatar: z.union([z.file().max(oneMB), z.undefined()]),
      coverPhoto: z.union([z.file().max(twoMB), z.undefined()]),
      firstName: z.string(),
      lastName: z.string(),
      email: z.email(),
      country: z.string(),
      city: z.string(),
      zipCode: z.string(),
      streetName: z.string(),
      streetNumber: z.string(),
      billingPlan: z.enum(['starter', 'pro', 'team']),
      billingCycle: z.enum(['monthly', 'yearly']),
      paymentMethod: z.enum(['card', 'paypal']),
      notificationLevel: z.enum(['all', 'important', 'none']),
      emailNotificationComments: z.boolean(),
      emailNotificationFollowers: z.boolean(),
      emailNotificationProductUpdates: z.boolean(),
      emailNotificationSecurityAlerts: z.boolean(),
      notificationCategories: z.array(z.string()),
      privacyShowOnlineStatus: z.boolean(),
      privacyAllowEmailDiscovery: z.boolean(),
      privacyEnableReadReceipts: z.boolean(),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      username: 'string',
      bio: 'string',
      avatar: 'file',
      coverPhoto: 'file',
      firstName: 'string',
      lastName: 'string',
      email: 'email',
      country: 'string',
      city: 'string',
      zipCode: 'string',
      streetName: 'string',
      streetNumber: 'string',
      billingPlan: 'enum',
      billingCycle: 'enum',
      paymentMethod: 'enum',
      notificationLevel: 'enum',
      emailNotificationComments: 'boolean',
      emailNotificationFollowers: 'boolean',
      emailNotificationProductUpdates: 'boolean',
      emailNotificationSecurityAlerts: 'boolean',
      notificationCategories: 'string[]',
      privacyShowOnlineStatus: 'boolean',
      privacyAllowEmailDiscovery: 'boolean',
      privacyEnableReadReceipts: 'boolean',
    };

    expect(actual).toEqual(expected);
  });

  test('given: schema with mixed field types, should: correctly identify each type', () => {
    const schema = z.object({
      name: z.string(),
      email: z.email(),
      age: z.string(),
      isAdmin: z.boolean(),
      role: z.enum(['user', 'admin']),
      tags: z.array(z.string()),
      avatar: z.file(),
    });

    const actual = getSchemaStructure(schema);
    const expected = {
      name: 'string',
      email: 'email',
      age: 'string',
      isAdmin: 'boolean',
      role: 'enum',
      tags: 'string[]',
      avatar: 'file',
    };

    expect(actual).toEqual(expected);
  });

  test('given: empty schema, should: return empty object', () => {
    const schema = z.object({});

    const actual = getSchemaStructure(schema);
    const expected = {};

    expect(actual).toEqual(expected);
  });
});
