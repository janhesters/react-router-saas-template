import { configureForms } from "@conform-to/react/future";

import { defineCustomMetadata } from "~/utils/define-custom-metadata";

/**
 * Pre-configured Conform form hooks for this application.
 *
 * `configureForms` bakes the app-wide form defaults and the custom field
 * metadata (e.g. `inputProps` and `otpInputProps`) into the returned hooks.
 * Always import `useForm` (and friends) from this module instead of
 * `@conform-to/react/future` so fields expose the custom metadata.
 *
 * @see {@link https://conform.guide/api/react/future/configureForms | Conform configureForms Documentation}
 */
export const { FormProvider, useField, useForm, useFormMetadata, useIntent } =
  configureForms({
    extendFieldMetadata: defineCustomMetadata,
    shouldRevalidate: "onBlur",
    shouldValidate: "onSubmit",
  });
