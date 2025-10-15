import { parseFormData } from '@mjackson/form-data-parser';
import type { MultipartParserOptions } from '@mjackson/multipart-parser';
import type { ZodObject } from 'zod';

import { getSchemaStructure } from './get-schema-structure.server';

export async function parseFormDataWithSchema<T extends ZodObject>(
  request: Request,
  schema: T,
  options?: MultipartParserOptions,
) {
  const formData = options
    ? await parseFormData(request, options)
    : await parseFormData(request);

  const structure = getSchemaStructure(schema);

  const arrayKeys = new Set(
    Object.entries(structure)
      .filter(([, t]) => t.endsWith('[]')) // string[], file[], number[]...
      .map(([k]) => k),
  );

  const booleanKeys = new Set(
    Object.entries(structure)
      .filter(([, t]) => t === 'boolean')
      .map(([k]) => k),
  );

  const fileKeys = new Set(
    Object.entries(structure)
      .filter(([, t]) => t === 'file')
      .map(([k]) => k),
  );

  // Build values with array semantics where needed
  const values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  const keys = new Set(formData.keys()); // distinct keys

  for (const key of keys) {
    const value = formData.get(key);

    if (arrayKeys.has(key)) {
      values[key] = formData.getAll(key);
    } else if (fileKeys.has(key)) {
      // For file fields, keep only if it's a File object
      // Skip empty strings (form parser converts empty files to '')
      if (value instanceof File) {
        values[key] = value;
      }
    } else {
      // For other fields, default to empty string
      values[key] = value ?? '';
    }
  }

  // Handle checkboxes: use empty string for false, keep 'on' for true
  // z.coerce.boolean() converts empty string to false, non-empty to true
  for (const key of booleanKeys) {
    if (!(key in values) || values[key] === null) {
      values[key] = '';
    }
    // Keep 'on' as-is since z.coerce.boolean() will convert it to true
  }

  // Default missing arrays to empty array []
  for (const key of arrayKeys) {
    if (!(key in values)) {
      values[key] = [];
    }
  }

  // Remove empty files (browser sends empty File when no file selected)
  // This allows optional file fields to work properly with .optional()
  for (const key of fileKeys) {
    const value = values[key];
    // Empty files have size 0 and either empty name or generic name like 'file-upload'
    if (
      value instanceof File &&
      value.size === 0 &&
      (value.name === '' || value.name === 'file-upload')
    ) {
      delete values[key];
    }
  }

  return schema.parse(values);
}
