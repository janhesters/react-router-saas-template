import type * as z4 from 'zod/v4/core';

// Type definitions for Zod v4 internal structures
type ZodInternalDefinition = {
  type: string;
  element?: z4.$ZodAny;
  options?: z4.$ZodAny[];
  shape?: Record<string, z4.$ZodAny>;
  [key: string]: unknown;
};

type ZodInternalBag = {
  format?: string;
  [key: string]: unknown;
};

type ZodInternal = {
  def: ZodInternalDefinition;
  bag?: ZodInternalBag;
  [key: string]: unknown;
};

/**
 * Gets the string representation of a Zod schema's type.
 * @param fieldSchema - The Zod schema for a specific field.
 * @returns A string representing the type (e.g., 'string', 'email', 'string[]').
 */
function getZodTypeName(fieldSchema: z4.$ZodAny): string {
  // The _zod.def property holds the schema's definition in Zod 4.
  const zodInternal = fieldSchema._zod as unknown as ZodInternal;
  const zodDefinition = zodInternal.def;
  const typeName = zodDefinition.type;

  switch (typeName) {
    case 'string': {
      // Check for specific string formats like 'email' or 'url'.
      // In Zod v4, z.email() and z.url() set bag.format
      const format = zodInternal.bag?.format;
      if (format === 'email') {
        return 'email';
      }
      if (format === 'url') {
        return 'url';
      }
      return 'string';
    }

    case 'boolean': {
      return 'boolean';
    }

    // As requested, handle a potential z.file() type.
    case 'file': {
      return 'file';
    }

    case 'enum': {
      return 'enum';
    }

    case 'array': {
      // For arrays, recursively find the type of the elements.
      const element = zodDefinition.element;
      if (!element) return 'array';
      const innerType = getZodTypeName(element);
      return `${innerType}[]`;
    }

    case 'union': {
      // For optional fields (union with undefined), find the primary type.
      const options = zodDefinition.options;
      if (!options) return 'union';

      const nonUndefinedOption = options.find(
        (option: z4.$ZodAny) =>
          (option._zod as unknown as ZodInternal).def.type !== 'undefined',
      );
      return nonUndefinedOption ? getZodTypeName(nonUndefinedOption) : 'union';
    }

    default: {
      // Fallback for any other Zod types (e.g., ZodNumber, ZodDate).
      return typeName;
    }
  }
}

/**
 * Parses a Zod object schema to extract its structure.
 *
 * @param schema - A Zod object schema.
 * @returns An object where keys are field names and values are their identified types.
 */
export function getSchemaStructure(
  schema: z4.$ZodObject,
): Record<string, string> {
  const result: Record<string, string> = {};

  // Access shape via _zod.def for type safety
  const zodInternal = schema._zod as unknown as ZodInternal;
  const shape = zodInternal.def.shape!;

  for (const key in shape) {
    if (Object.prototype.hasOwnProperty.call(shape, key)) {
      const fieldSchema = shape[key]!;
      result[key] = getZodTypeName(fieldSchema);
    }
  }

  return result;
}
