import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export function BentoGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("grid gap-4 lg:grid-cols-3 lg:grid-rows-2", className)}
      {...props}
    />
  );
}

export function BentoCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-lg border border-border shadow-sm", className)}
      {...props}
    />
  );
}

export function BentoCardHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-2 p-10", className)} {...props} />
  );
}

export function BentoCardEyeBrow({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      className={cn("text-sm font-semibold text-primary", className)}
      {...props}
    />
  );
}

export function BentoCardTitle({
  children,
  className,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function BentoCardDescription({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={cn("max-w-lg text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function BentoCardMedia({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("overflow-hidden", className)} {...props} />;
}
