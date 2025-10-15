import { faker } from '@faker-js/faker';
import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { useForm } from './use-form';

describe('useForm()', () => {
  test('given: a schema with a simple string field, should: return props for label, input, errors, form with no errors', () => {
    const schema = z.object({
      name: z.string(),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getLabelProps('name')).toEqual({
      htmlFor: expect.stringMatching(/^.*-name$/) as string,
    });
    expect(result.current.getInputProps('name')).toEqual({
      id: expect.stringMatching(/^.*-name$/) as string,
      name: 'name',
      'aria-describedby': expect.stringMatching(
        /^.*-name-description$/,
      ) as string,
      'aria-invalid': false,
    });
    expect(result.current.getErrors('name')).toEqual([]);
    expect(result.current.getErrorProps('name')).toEqual({
      id: expect.stringMatching(/^.*-name-errors$/) as string,
    });
    expect(result.current.getDescriptionProps('name')).toEqual({
      id: expect.stringMatching(/^.*-name-description$/) as string,
    });

    expect(result.current.getFormProps()).toEqual({});
    expect(result.current.getFormErrors()).toEqual([]);
  });

  test('given: a schema with min/max length constraints, should: return input props with minLength and maxLength attributes', () => {
    const minLength = faker.number.int({ min: 3, max: 32 });
    const maxLength = minLength + faker.number.int({ min: 3, max: 32 });
    const schema = z.object({
      name: z.string().min(minLength).max(maxLength),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('name')).toEqual({
      id: expect.stringMatching(/^.*-name$/) as string,
      name: 'name',
      'aria-describedby': expect.stringMatching(
        /^.*-name-description$/,
      ) as string,
      'aria-invalid': false,
      minLength,
      maxLength,
      required: true,
    });
  });

  test('given: a schema with optional field that has min length, should: return input props with minLength but NOT required attribute', () => {
    const minLength = faker.number.int({ min: 3, max: 32 });
    const schema = z.object({
      bio: z.string().min(minLength).optional(),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('bio')).toEqual({
      id: expect.stringMatching(/^.*-bio$/) as string,
      name: 'bio',
      'aria-describedby': expect.stringMatching(
        /^.*-bio-description$/,
      ) as string,
      'aria-invalid': false,
      minLength,
    });
  });

  test('given: a schema with a number field with min/max constraints, should: return input props with type="number" and min/max attributes', () => {
    const min = faker.number.int({ min: 18, max: 65 });
    const max = min + faker.number.int({ min: 10, max: 50 });
    const schema = z.object({
      age: z.number().min(min).max(max),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('age')).toEqual({
      id: expect.stringMatching(/^.*-age$/) as string,
      name: 'age',
      'aria-describedby': expect.stringMatching(
        /^.*-age-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'number',
      min,
      max,
    });
  });

  test('given: a schema with different field types (string, email, number, url), should: return appropriate HTML input type attributes', () => {
    const schema = z.object({
      name: z.string(),
      email: z.email(),
      age: z.number(),
      website: z.url(),
      newsletter: z.boolean(),
    });

    const { result } = renderHook(() => useForm({ schema }));

    // Label props
    expect(result.current.getLabelProps('name')).toEqual({
      htmlFor: expect.stringMatching(/^.*-name$/) as string,
    });
    expect(result.current.getLabelProps('email')).toEqual({
      htmlFor: expect.stringMatching(/^.*-email$/) as string,
    });
    expect(result.current.getLabelProps('age')).toEqual({
      htmlFor: expect.stringMatching(/^.*-age$/) as string,
    });
    expect(result.current.getLabelProps('website')).toEqual({
      htmlFor: expect.stringMatching(/^.*-website$/) as string,
    });
    expect(result.current.getLabelProps('newsletter')).toEqual({
      htmlFor: expect.stringMatching(/^.*-newsletter$/) as string,
    });

    // Input props
    expect(result.current.getInputProps('name')).toEqual({
      id: expect.stringMatching(/^.*-name$/) as string,
      name: 'name',
      'aria-describedby': expect.stringMatching(
        /^.*-name-description$/,
      ) as string,
      'aria-invalid': false,
    });
    expect(result.current.getInputProps('email')).toEqual({
      id: expect.stringMatching(/^.*-email$/) as string,
      name: 'email',
      'aria-describedby': expect.stringMatching(
        /^.*-email-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'email',
    });
    expect(result.current.getInputProps('age')).toEqual({
      id: expect.stringMatching(/^.*-age$/) as string,
      name: 'age',
      'aria-describedby': expect.stringMatching(
        /^.*-age-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'number',
    });
    expect(result.current.getInputProps('website')).toEqual({
      id: expect.stringMatching(/^.*-website$/) as string,
      name: 'website',
      'aria-describedby': expect.stringMatching(
        /^.*-website-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'url',
    });
    expect(result.current.getInputProps('newsletter')).toEqual({
      id: expect.stringMatching(/^.*-newsletter$/) as string,
      name: 'newsletter',
      'aria-invalid': false,
    });

    // Errors
    expect(result.current.getErrors('name')).toEqual([]);
    expect(result.current.getErrors('email')).toEqual([]);
    expect(result.current.getErrors('age')).toEqual([]);
    expect(result.current.getErrors('website')).toEqual([]);
    expect(result.current.getErrors('newsletter')).toEqual([]);

    // Error props
    expect(result.current.getErrorProps('name')).toEqual({
      id: expect.stringMatching(/^.*-name-errors$/) as string,
    });
    expect(result.current.getErrorProps('email')).toEqual({
      id: expect.stringMatching(/^.*-email-errors$/) as string,
    });
    expect(result.current.getErrorProps('age')).toEqual({
      id: expect.stringMatching(/^.*-age-errors$/) as string,
    });
    expect(result.current.getErrorProps('website')).toEqual({
      id: expect.stringMatching(/^.*-website-errors$/) as string,
    });
    expect(result.current.getErrorProps('newsletter')).toEqual({
      id: expect.stringMatching(/^.*-newsletter-errors$/) as string,
    });
  });

  test('given: validation errors for specific fields, should: return field errors and update aria-describedby to point to error elements', () => {
    const schema = z.object({
      name: z.string(),
      foo: z.string().min(5).startsWith('bar'),
    });
    const parseResult = schema.safeParse({ name: 123, foo: '' });
    const errors = parseResult.success ? undefined : parseResult.error;

    const { result } = renderHook(() => useForm({ schema, errors }));

    expect(result.current.getInputProps('name')).toEqual({
      id: expect.stringMatching(/^.*-name$/) as string,
      name: 'name',
      'aria-describedby': expect.stringMatching(/^.*-name-errors$/) as string,
      'aria-invalid': true,
    });
    expect(result.current.getErrors('name')).toEqual([
      { message: 'Invalid input: expected string, received number' },
    ]);
    expect(result.current.getErrorProps('name')).toEqual({
      id: expect.stringMatching(/^.*-name-errors$/) as string,
    });

    expect(result.current.getInputProps('foo')).toEqual({
      id: expect.stringMatching(/^.*-foo$/) as string,
      name: 'foo',
      'aria-describedby': expect.stringMatching(/^.*-foo-errors$/) as string,
      'aria-invalid': true,
      minLength: 5,
      required: true,
    });
    expect(result.current.getErrors('foo')).toEqual([
      { message: 'Too small: expected string to have >=5 characters' },
      { message: 'Invalid string: must start with "bar"' },
    ]);
    expect(result.current.getErrorProps('foo')).toEqual({
      id: expect.stringMatching(/^.*-foo-errors$/) as string,
    });
  });

  test('given: form-level validation errors from .refine(), should: return form errors and update form props with aria-describedby', () => {
    const schema = z
      .object({
        password: z.string().min(8, 'Password is too short'),
        confirm: z.string(),
      })
      .refine(data => data.password === data.confirm, {
        message: 'Passwords do not match',
      });

    const parseResult = schema.safeParse({
      password: 'password123',
      confirm: 'password456',
    });
    const errors = parseResult.success ? undefined : parseResult.error;

    const { result } = renderHook(() => useForm({ schema, errors }));

    const formErrorProps = result.current.getFormErrorProps();
    const formProps = result.current.getFormProps();

    expect(result.current.getFormErrors()).toEqual([
      { message: 'Passwords do not match' },
    ]);

    expect(formErrorProps).toEqual({
      id: expect.stringMatching(/^.*-form-errors$/) as string,
      role: 'alert',
    });

    expect(formProps).toEqual({
      'aria-describedby': formErrorProps.id,
    });

    expect(result.current.getErrors('password')).toEqual([]);
  });

  test('given: a schema with an enum field and type: "radio", should: return radio group props with all enum options and their respective item/label props', () => {
    const schema = z.object({
      plan: z.enum(['starter', 'pro', 'enterprise']),
    });

    const { result } = renderHook(() => useForm({ schema }));

    const radioProps = result.current.getInputProps('plan', { type: 'radio' });

    // Group props should have name and aria attributes
    expect(radioProps.group).toEqual({
      name: 'plan',
      'aria-invalid': false,
      'aria-describedby': expect.stringMatching(
        /^.*-plan-description$/,
      ) as string,
    });

    // Field props should have data-invalid attribute
    expect(radioProps.field).toEqual({
      'data-invalid': false,
    });

    // Should have 3 items matching the enum values
    expect(radioProps.items).toHaveLength(3);

    // Each item should have value, item props, and label props
    expect(radioProps.items[0]).toEqual({
      value: 'starter',
      item: {
        value: 'starter',
        id: expect.stringMatching(/^.*-plan-starter$/) as string,
        'aria-invalid': false,
      },
      label: {
        htmlFor: expect.stringMatching(/^.*-plan-starter$/) as string,
      },
    });

    expect(radioProps.items[1]).toEqual({
      value: 'pro',
      item: {
        value: 'pro',
        id: expect.stringMatching(/^.*-plan-pro$/) as string,
        'aria-invalid': false,
      },
      label: {
        htmlFor: expect.stringMatching(/^.*-plan-pro$/) as string,
      },
    });

    expect(radioProps.items[2]).toEqual({
      value: 'enterprise',
      item: {
        value: 'enterprise',
        id: expect.stringMatching(/^.*-plan-enterprise$/) as string,
        'aria-invalid': false,
      },
      label: {
        htmlFor: expect.stringMatching(/^.*-plan-enterprise$/) as string,
      },
    });

    // IDs should match between item and label
    expect(radioProps.items[0]?.label.htmlFor).toEqual(
      radioProps.items[0]?.item.id,
    );
  });

  test('given: a schema with an enum field that has validation errors and type: "radio", should: return radio group props with aria-invalid set to true', () => {
    const schema = z.object({
      plan: z.enum(['starter', 'pro', 'enterprise']),
    });

    const parseResult = schema.safeParse({ plan: 'invalid-plan' });
    const errors = parseResult.success ? undefined : parseResult.error;

    const { result } = renderHook(() => useForm({ schema, errors }));

    const radioProps = result.current.getInputProps('plan', { type: 'radio' });

    // Group should be marked as invalid
    expect(radioProps.group).toEqual({
      name: 'plan',
      'aria-invalid': true,
      'aria-describedby': expect.stringMatching(/^.*-plan-errors$/) as string,
    });

    // Field should be marked as invalid
    expect(radioProps.field).toEqual({
      'data-invalid': true,
    });

    // All items should be marked as invalid
    for (const item of radioProps.items) {
      expect(item.item['aria-invalid']).toEqual(true);
    }

    // Should have errors
    expect(result.current.getErrors('plan')).toEqual([
      {
        message: 'Invalid option: expected one of "starter"|"pro"|"enterprise"',
      },
    ]);
  });

  test('given: a schema with an enum field and type: "select", should: return select props with root and trigger objects', () => {
    const schema = z.object({
      country: z.enum(['US', 'UK', 'DE', 'FR']),
    });

    const { result } = renderHook(() => useForm({ schema }));

    const selectProps = result.current.getInputProps('country', {
      type: 'select',
    });

    // Root props should have name and aria-describedby
    expect(selectProps.root).toEqual({
      name: 'country',
      'aria-describedby': expect.stringMatching(
        /^.*-country-description$/,
      ) as string,
    });

    // Trigger props should have id and aria-invalid
    expect(selectProps.trigger).toEqual({
      id: expect.stringMatching(/^.*-country$/) as string,
      'aria-invalid': false,
    });

    // ID should be consistent with label
    const labelProps = result.current.getLabelProps('country');
    expect(labelProps.htmlFor).toEqual(selectProps.trigger.id);
  });

  test('given: a schema with an enum field that has validation errors and type: "select", should: return select props with aria-invalid set to true', () => {
    const schema = z.object({
      country: z.enum(['US', 'UK', 'DE', 'FR']),
    });

    const parseResult = schema.safeParse({ country: 'XX' });
    const errors = parseResult.success ? undefined : parseResult.error;

    const { result } = renderHook(() => useForm({ schema, errors }));

    const selectProps = result.current.getInputProps('country', {
      type: 'select',
    });

    // Root should point to errors
    expect(selectProps.root).toEqual({
      name: 'country',
      'aria-describedby': expect.stringMatching(
        /^.*-country-errors$/,
      ) as string,
    });

    // Trigger should be marked as invalid
    expect(selectProps.trigger).toEqual({
      id: expect.stringMatching(/^.*-country$/) as string,
      'aria-invalid': true,
    });

    // Should have errors
    expect(result.current.getErrors('country')).toEqual([
      { message: 'Invalid option: expected one of "US"|"UK"|"DE"|"FR"' },
    ]);

    // Field props should also be invalid
    expect(result.current.getFieldProps('country')).toEqual({
      'data-invalid': true,
    });
  });

  test('given: a schema with a file field without MIME constraints, should: return input props with type="file" and no accept attribute', () => {
    const schema = z.object({
      document: z.file(),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('document')).toEqual({
      id: expect.stringMatching(/^.*-document$/) as string,
      name: 'document',
      'aria-describedby': expect.stringMatching(
        /^.*-document-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'file',
    });
  });

  test('given: a schema with a file field with single MIME type constraint, should: return input props with type="file" and appropriate accept attribute', () => {
    const schema = z.object({
      avatar: z.file().mime('image/png'),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('avatar')).toEqual({
      id: expect.stringMatching(/^.*-avatar$/) as string,
      name: 'avatar',
      'aria-describedby': expect.stringMatching(
        /^.*-avatar-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'file',
      accept: 'image/png',
    });
  });

  test('given: a schema with a file field with wildcard MIME type (image/*), should: return input props with type="file" and accept="image/*"', () => {
    const schema = z.object({
      photo: z.file().mime('image/*'),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('photo')).toEqual({
      id: expect.stringMatching(/^.*-photo$/) as string,
      name: 'photo',
      'aria-describedby': expect.stringMatching(
        /^.*-photo-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'file',
      accept: 'image/*',
    });
  });

  test('given: a schema with a file field with multiple MIME types, should: return input props with comma-separated accept attribute', () => {
    const schema = z.object({
      resume: z.file().mime(['application/pdf', 'application/msword']),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('resume')).toEqual({
      id: expect.stringMatching(/^.*-resume$/) as string,
      name: 'resume',
      'aria-describedby': expect.stringMatching(
        /^.*-resume-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'file',
      accept: 'application/pdf,application/msword',
    });
  });

  test('given: a schema with a file field with size constraints, should: return input props with type="file" and accept from MIME types', () => {
    const oneMB = 1024 * 1024;
    const schema = z.object({
      attachment: z.file().max(oneMB).mime('image/*'),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('attachment')).toEqual({
      id: expect.stringMatching(/^.*-attachment$/) as string,
      name: 'attachment',
      'aria-describedby': expect.stringMatching(
        /^.*-attachment-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'file',
      accept: 'image/*',
    });
  });

  test('given: a schema with file field that has validation errors, should: return field errors and update aria-describedby to point to error elements', () => {
    const schema = z.object({
      avatar: z.file().mime('image/png'),
      document: z.file(),
    });

    // Create errors manually (since we can't actually upload files in tests)
    const parseResult = schema.safeParse({
      avatar: 'not-a-file',
      document: 'also-not-a-file',
    });
    const errors = parseResult.success ? undefined : parseResult.error;

    const { result } = renderHook(() => useForm({ schema, errors }));

    expect(result.current.getInputProps('avatar')).toEqual({
      id: expect.stringMatching(/^.*-avatar$/) as string,
      name: 'avatar',
      'aria-describedby': expect.stringMatching(/^.*-avatar-errors$/) as string,
      'aria-invalid': true,
      type: 'file',
      accept: 'image/png',
    });

    expect(result.current.getErrors('avatar')).toEqual([
      { message: 'Invalid input: expected file, received string' },
    ]);

    expect(result.current.getInputProps('document')).toEqual({
      id: expect.stringMatching(/^.*-document$/) as string,
      name: 'document',
      'aria-describedby': expect.stringMatching(
        /^.*-document-errors$/,
      ) as string,
      'aria-invalid': true,
      type: 'file',
    });

    expect(result.current.getErrors('document')).toEqual([
      { message: 'Invalid input: expected file, received string' },
    ]);
  });

  test('given: a schema with multiple file types (images, PDFs, Office docs), should: return appropriate accept attributes for each', () => {
    const schema = z.object({
      profilePic: z.file().mime(['image/jpeg', 'image/png', 'image/webp']),
      document: z
        .file()
        .mime([
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]),
      video: z.file().mime(['video/mp4', 'video/webm']),
    });

    const { result } = renderHook(() => useForm({ schema }));

    expect(result.current.getInputProps('profilePic')).toEqual({
      id: expect.stringMatching(/^.*-profilePic$/) as string,
      name: 'profilePic',
      'aria-describedby': expect.stringMatching(
        /^.*-profilePic-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
    });

    expect(result.current.getInputProps('document')).toEqual({
      id: expect.stringMatching(/^.*-document$/) as string,
      name: 'document',
      'aria-describedby': expect.stringMatching(
        /^.*-document-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'file',
      accept:
        'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    expect(result.current.getInputProps('video')).toEqual({
      id: expect.stringMatching(/^.*-video$/) as string,
      name: 'video',
      'aria-describedby': expect.stringMatching(
        /^.*-video-description$/,
      ) as string,
      'aria-invalid': false,
      type: 'file',
      accept: 'video/mp4,video/webm',
    });
  });

  test('given: a field with no errors, should: return consistent IDs across label, input, and description props', () => {
    const schema = z.object({
      username: z.string(),
    });

    const { result } = renderHook(() => useForm({ schema }));

    const labelProps = result.current.getLabelProps('username');
    const inputProps = result.current.getInputProps('username');
    const descriptionProps = result.current.getDescriptionProps('username');

    // Label htmlFor should match input id
    expect(labelProps.htmlFor).toEqual(inputProps.id);

    // Input aria-describedby should match description id
    expect(inputProps['aria-describedby']).toEqual(descriptionProps.id);
  });

  test('given: a field with validation errors, should: return consistent IDs with aria-describedby pointing to errors instead of description', () => {
    const schema = z.object({
      username: z.string().min(5),
    });

    const parseResult = schema.safeParse({ username: 'ab' });
    const errors = parseResult.success ? undefined : parseResult.error;

    const { result } = renderHook(() => useForm({ schema, errors }));

    const labelProps = result.current.getLabelProps('username');
    const inputProps = result.current.getInputProps('username');
    const errorProps = result.current.getErrorProps('username');
    const descriptionProps = result.current.getDescriptionProps('username');

    // Label htmlFor should still match input id
    expect(labelProps.htmlFor).toEqual(inputProps.id);

    // Input aria-describedby should now match error id (not description id)
    expect(inputProps['aria-describedby']).toEqual(errorProps.id);
    expect(inputProps['aria-describedby']).not.toEqual(descriptionProps.id);
  });

  test('given: a schema with a boolean field, should: return id, name, and aria-invalid props for checkbox', () => {
    const schema = z.object({
      acceptTerms: z.boolean(),
      newsletter: z.boolean(),
      marketing: z.boolean().optional(),
    });

    const { result } = renderHook(() => useForm({ schema }));

    // Boolean fields should return id, name, and aria-invalid
    expect(result.current.getInputProps('acceptTerms')).toEqual({
      id: expect.stringMatching(/^.*-acceptTerms$/) as string,
      name: 'acceptTerms',
      'aria-invalid': false,
    });

    expect(result.current.getInputProps('newsletter')).toEqual({
      id: expect.stringMatching(/^.*-newsletter$/) as string,
      name: 'newsletter',
      'aria-invalid': false,
    });

    // Optional boolean should also return id, name, and aria-invalid
    expect(result.current.getInputProps('marketing')).toEqual({
      id: expect.stringMatching(/^.*-marketing$/) as string,
      name: 'marketing',
      'aria-invalid': false,
    });
  });

  test('given: a schema with boolean fields that have validation errors, should: return id, name, and aria-invalid=true', () => {
    const schema = z.object({
      acceptTerms: z.boolean().refine(value => value === true, {
        message: 'You must accept the terms',
      }),
    });

    const parseResult = schema.safeParse({ acceptTerms: false });
    const errors = parseResult.success ? undefined : parseResult.error;

    const { result } = renderHook(() => useForm({ schema, errors }));

    // Boolean fields should return id, name, and aria-invalid=true when there are errors
    expect(result.current.getInputProps('acceptTerms')).toEqual({
      id: expect.stringMatching(/^.*-acceptTerms$/) as string,
      name: 'acceptTerms',
      'aria-invalid': true,
    });

    // Errors should be available separately
    expect(result.current.getErrors('acceptTerms')).toEqual([
      { message: 'You must accept the terms' },
    ]);

    // Field props should indicate invalid state
    expect(result.current.getFieldProps('acceptTerms')).toEqual({
      'data-invalid': true,
    });
  });
});
