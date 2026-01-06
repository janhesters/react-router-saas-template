import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export function DescriptionList({ className, ...props }: ComponentProps<"dl">) {
  return (
    <dl className={cn("grid gap-3 divide-border", className)} {...props} />
  );
}

export function DescriptionListRow({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex gap-2 @xl/form:px-6 px-4", className)}
      {...props}
    />
  );
}

export function DescriptionTerm({ className, ...props }: ComponentProps<"dt">) {
  return <dt className={cn("font-medium text-sm", className)} {...props} />;
}

export function DescriptionDetail({
  className,
  ...props
}: ComponentProps<"dd">) {
  return <dd className={cn("font-normal text-sm", className)} {...props} />;
}
