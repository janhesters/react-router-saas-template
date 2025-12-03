import type { BaseMetadata } from "@conform-to/react/future";
import type { ComponentProps } from "react";

import type { Input } from "~/components/ui/input";
import type { InputOTP } from "~/components/ui/input-otp";

/**
 * Defines custom metadata properties for form fields to provide seamless integration
 * with UI components.
 *
 * This function extends Conform's base metadata with custom properties that match
 * the component APIs used in this application. It enables type-safe access to
 * component-specific props directly from field metadata objects.
 *
 * @template FieldShape - The shape/type of the field value
 * @template ErrorShape - The shape/type of validation errors
 *
 * @param metadata - Base metadata object provided by Conform containing field information
 *
 * @returns An object containing custom property getters:
 * - `inputProps`: Props compatible with the `Input` component, including ARIA attributes
 *   for accessibility
 * - `otpInputProps`: Props compatible with the `InputOTP` component, including ARIA attributes
 *   for accessibility
 *
 * @example
 * ```tsx
 * // Used globally via FormOptionsProvider in root.tsx
 * <FormOptionsProvider defineCustomMetadata={defineCustomMetadata}>
 *   <App />
 * </FormOptionsProvider>
 *
 * // Then access in any form component
 * function LoginForm() {
 *   const { fields } = useForm(schema, { ... });
 *   return <Input {...fields.email.inputProps} />;
 * }
 * ```
 *
 * @see {@link https://conform.guide/api/react/future/FormOptionsProvider | Conform FormOptionsProvider Documentation}
 */
export function defineCustomMetadata<FieldShape, ErrorShape>(
  metadata: BaseMetadata<FieldShape, ErrorShape>,
) {
  return {
    get inputProps() {
      return {
        "aria-describedby": metadata.ariaDescribedBy,
        "aria-invalid": metadata.ariaInvalid,
        id: metadata.id,
        name: metadata.name,
      } satisfies Partial<ComponentProps<typeof Input>>;
    },
    get otpInputProps() {
      return {
        "aria-describedby": metadata.ariaDescribedBy,
        "aria-invalid": metadata.ariaInvalid,
        id: metadata.id,
        name: metadata.name,
      } satisfies Partial<ComponentProps<typeof InputOTP>>;
    },
  };
}
