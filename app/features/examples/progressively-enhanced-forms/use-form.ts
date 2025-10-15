import { useId } from 'react';
import type * as z4 from 'zod/v4/core';

type KeyOf<T extends z4.$ZodObject> = Extract<keyof z4.output<T>, string>;

// Type definitions for Zod v4 internal structures
type ZodInternalDefinition = {
  type: string;
  innerType?: z4.$ZodType;
  shape?: Record<string, z4.$ZodType>;
  values?: readonly string[];
  [key: string]: unknown;
};

type ZodInternalBag = {
  format?: string;
  mime?: string[];
  minimum?: number;
  maximum?: number;
  [key: string]: unknown;
};

type ZodInternal = {
  def: ZodInternalDefinition;
  bag?: ZodInternalBag;
};

// Type helpers for enum detection
type GetFieldSchema<T extends z4.$ZodObject, K extends KeyOf<T>> = T extends {
  shape: infer Shape;
}
  ? Shape extends Record<string, z4.$ZodType>
    ? K extends keyof Shape
      ? Shape[K]
      : never
    : never
  : never;

type IsEnumField<T extends z4.$ZodObject, K extends KeyOf<T>> =
  GetFieldSchema<T, K> extends z4.$ZodEnum<infer _E> ? true : false;

// Conditional parameter types
type RequireOptionsForEnum<T extends z4.$ZodObject, K extends KeyOf<T>> =
  IsEnumField<T, K> extends true
    ? [{ type: 'radio' | 'select' }]
    : [{ type?: never }?];

// Return types for different input types
type RadioGroupPropsBundle = {
  group: {
    name: string;
    'aria-invalid': boolean;
    'aria-describedby': string;
  };
  field: {
    'data-invalid': boolean;
  };
  items: {
    value: string;
    item: {
      value: string;
      id: string;
      'aria-invalid': boolean;
    };
    label: {
      htmlFor: string;
    };
  }[];
};

type SelectPropsBundle = {
  root: {
    name: string;
    'aria-describedby': string;
  };
  trigger: {
    id: string;
    'aria-invalid': boolean;
  };
};

type BaseInputProps = {
  id: string;
  name: string;
  'aria-describedby': string;
  'aria-invalid': boolean;
  [key: string]: unknown;
};

type CheckboxProps = {
  id: string;
  name: string;
  'aria-invalid': boolean;
};

// Properties that exist on Zod schemas via Standard Schema implementation
type ZodStandardSchemaProps = {
  type?: string;
  format?: string | null;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  options?: readonly string[];
  enum?: Record<string, string>;
};

/**
 * Extracts HTML input constraints from a Zod schema.
 * Handles optional fields by unwrapping the inner type.
 */
function extractFieldConstraints(fieldSchema: z4.$ZodType) {
  const constraints: Record<string, unknown> = {};
  const zodInternal = fieldSchema._zod as unknown as ZodInternal;
  const isOptional = zodInternal.def.type === 'optional';

  // For optional fields, we need to look at the innerType for constraints
  const innerType = isOptional ? zodInternal.def.innerType : fieldSchema;
  const innerInternal = isOptional
    ? (zodInternal.def.innerType?._zod as unknown as ZodInternal | undefined)
    : zodInternal;

  if (!innerInternal) {
    return constraints;
  }

  // Cast to access Standard Schema properties
  const standardProps = innerType as z4.$ZodType & ZodStandardSchemaProps;
  const definition = innerInternal.def;

  // Extract length constraints for strings
  if (
    standardProps.minLength !== undefined &&
    standardProps.minLength !== null
  ) {
    constraints.minLength = standardProps.minLength;

    // If the field has minLength and is not optional, mark it as required
    if (!isOptional) {
      constraints.required = true;
    }
  }
  if (
    standardProps.maxLength !== undefined &&
    standardProps.maxLength !== null
  ) {
    constraints.maxLength = standardProps.maxLength;
  }

  // For number fields, extract min/max values (only if finite)
  if (
    standardProps.minValue !== undefined &&
    standardProps.minValue !== null &&
    Number.isFinite(standardProps.minValue)
  ) {
    constraints.min = standardProps.minValue;
  }
  if (
    standardProps.maxValue !== undefined &&
    standardProps.maxValue !== null &&
    Number.isFinite(standardProps.maxValue)
  ) {
    constraints.max = standardProps.maxValue;
  }

  // Map Zod types to HTML input types
  const typeName = definition.type;
  if (typeName === 'number') {
    constraints.type = 'number';
  } else if (typeName === 'boolean') {
    constraints.type = 'checkbox';
  } else if (standardProps.format === 'email') {
    constraints.type = 'email';
  } else if (standardProps.format === 'url') {
    constraints.type = 'url';
  } else if (typeName === 'file') {
    constraints.type = 'file';

    // Extract MIME types from bag and convert to accept attribute
    const mimeTypes = innerInternal.bag?.mime;
    if (mimeTypes && mimeTypes.length > 0) {
      constraints.accept = mimeTypes.join(',');
    }
  }

  return constraints;
}

/**
 * Type guard to check if a field schema is an enum at runtime.
 * Returns a type predicate that narrows the type appropriately.
 */
function isEnumField(fieldSchema: z4.$ZodType): fieldSchema is z4.$ZodType & {
  _zod: { def: { type: 'enum'; values: readonly string[] } };
} {
  if (!fieldSchema || typeof fieldSchema !== 'object') return false;
  const zodInternal = fieldSchema._zod as unknown as ZodInternal;
  return zodInternal.def.type === 'enum';
}

/**
 * Extracts enum values from a Zod enum schema.
 * Returns an empty array if the schema is not an enum.
 */
function getEnumValues(fieldSchema: z4.$ZodType): string[] {
  if (!isEnumField(fieldSchema)) return [];
  // In Zod v4, enum values are exposed via the Standard Schema `options` property
  const standardProps = fieldSchema as z4.$ZodType & ZodStandardSchemaProps;
  return [...(standardProps.options ?? [])];
}

/**
 * Helper to check if a field is boolean at runtime.
 * Handles both direct boolean types and optional booleans.
 */
function isBooleanField(fieldSchema: z4.$ZodType): boolean {
  if (!fieldSchema || typeof fieldSchema !== 'object') return false;
  const zodInternal = fieldSchema._zod as unknown as ZodInternal;

  // Check if it's a boolean type directly
  if (zodInternal.def.type === 'boolean') return true;

  // Check if it's an optional boolean
  if (zodInternal.def.type === 'optional') {
    const innerType = zodInternal.def.innerType;
    if (innerType) {
      const innerInternal = innerType._zod as unknown as ZodInternal;
      if (innerInternal.def.type === 'boolean') return true;
    }
  }

  return false;
}

export function useForm<T extends z4.$ZodObject>({
  errors,
  schema,
}: {
  errors?: Pick<z4.$ZodError<z4.output<T>>, 'issues'>;
  schema: T;
}) {
  const id = useId();

  function getLabelProps(key: KeyOf<T>) {
    return {
      htmlFor: `${id}-${key}`,
    };
  }

  // Overload 1: Radio
  function getInputProps<K extends KeyOf<T>>(
    key: K,
    ...args: IsEnumField<T, K> extends true
      ? [{ type: 'radio' }]
      : [{ type?: never }?]
  ): IsEnumField<T, K> extends true ? RadioGroupPropsBundle : BaseInputProps;

  // Overload 2: Select
  function getInputProps<K extends KeyOf<T>>(
    key: K,
    ...args: IsEnumField<T, K> extends true
      ? [{ type: 'select' }]
      : [{ type?: never }?]
  ): IsEnumField<T, K> extends true ? SelectPropsBundle : BaseInputProps;

  // Implementation
  function getInputProps<K extends KeyOf<T>>(
    key: K,
    ...args: RequireOptionsForEnum<T, K>
  ):
    | RadioGroupPropsBundle
    | SelectPropsBundle
    | CheckboxProps
    | BaseInputProps {
    const options = args[0];
    const hasErrors = getErrors(key).length > 0;
    const baseAriaDescribedBy = hasErrors
      ? `${id}-${key}-errors`
      : `${id}-${key}-description`;

    const zodInternal = schema._zod as unknown as ZodInternal;
    const shape = zodInternal.def.shape;
    const fieldSchema = shape?.[key];

    // Handle radio
    if (options?.type === 'radio') {
      const enumValues = fieldSchema ? getEnumValues(fieldSchema) : [];

      return {
        group: {
          name: key,
          'aria-invalid': hasErrors,
          'aria-describedby': baseAriaDescribedBy,
        },
        field: {
          'data-invalid': hasErrors,
        },
        items: enumValues.map((value: string) => ({
          value,
          item: {
            value,
            id: `${id}-${key}-${value}`,
            'aria-invalid': hasErrors,
          },
          label: {
            htmlFor: `${id}-${key}-${value}`,
          },
        })),
      };
    }

    // Handle select
    if (options?.type === 'select') {
      return {
        root: {
          name: key,
          'aria-describedby': baseAriaDescribedBy,
        },
        trigger: {
          id: `${id}-${key}`,
          'aria-invalid': hasErrors,
        },
      };
    }

    // Handle boolean/checkbox fields - return id, name, and aria-invalid
    if (fieldSchema && isBooleanField(fieldSchema)) {
      return {
        id: `${id}-${key}`,
        name: key,
        'aria-invalid': hasErrors,
      };
    }

    // Handle regular inputs
    const baseProps = {
      id: `${id}-${key}`,
      name: key,
      'aria-describedby': baseAriaDescribedBy,
      'aria-invalid': hasErrors,
    };

    if (fieldSchema) {
      const constraints = extractFieldConstraints(fieldSchema);
      return { ...baseProps, ...constraints };
    }

    return baseProps;
  }

  function getErrors(key: KeyOf<T>) {
    if (!errors) {
      return [];
    }

    // Find errors for this field
    const fieldErrors = errors.issues
      .filter(issue => issue.path?.[0] === key)
      .map(issue => ({ message: issue.message }));

    return fieldErrors;
  }

  function getErrorProps(key: KeyOf<T>) {
    return {
      id: `${id}-${key}-errors`,
    };
  }

  function getFormProps() {
    const hasFormErrors = getFormErrors().length > 0;

    if (hasFormErrors) {
      return {
        'aria-describedby': `${id}-form-errors`,
      };
    }

    return {};
  }

  function getFormErrors() {
    if (!errors) {
      return [];
    }

    // Form-level errors are those without a field path (or with empty path)
    return errors.issues
      .filter(issue => !issue.path || issue.path.length === 0)
      .map(issue => ({ message: issue.message }));
  }

  function getFormErrorProps() {
    return {
      id: `${id}-form-errors`,
      role: 'alert',
    };
  }

  function getFieldProps(key: KeyOf<T>) {
    return {
      'data-invalid': getErrors(key).length > 0,
    };
  }

  function getDescriptionProps(key: KeyOf<T>) {
    return {
      id: `${id}-${key}-description`,
    };
  }

  return {
    getDescriptionProps,
    getErrorProps,
    getErrors,
    getFieldProps,
    getFormErrorProps,
    getFormErrors,
    getFormProps,
    getInputProps,
    getLabelProps,
  };
}
