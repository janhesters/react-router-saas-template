import type * as React from "react";

import { cn } from "~/lib/utils";

export function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number;
}) {
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}
