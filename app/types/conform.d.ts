import type { defineCustomMetadata } from "~/utils/define-custom-metadata";

declare module "@conform-to/react/future" {
  interface CustomMetadata<FieldShape, ErrorShape>
    extends ReturnType<typeof defineCustomMetadata<FieldShape, ErrorShape>> {}
}
