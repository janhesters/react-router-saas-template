import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "~/lib/utils";

const inputBaseClass =
  "dark:bg-input/30 border-input h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";
const inputFocusClass =
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";
const inputErrorClass =
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 aria-invalid:ring-[3px]";
const inputClassName = cn(inputBaseClass, inputFocusClass, inputErrorClass);

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      className={cn(inputClassName, className)}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input, inputClassName };
