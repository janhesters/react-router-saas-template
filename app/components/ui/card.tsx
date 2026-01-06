import type * as React from "react";

import { cn } from "~/lib/utils";

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      className={cn(
        "group/card flex flex-col gap-6 overflow-hidden rounded-xl bg-card py-6 text-card-foreground text-sm shadow-xs ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className,
      )}
      data-size={size}
      data-slot="card"
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] group-data-[size=sm]/card:px-4 [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4",
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-medium text-base leading-normal group-data-[size=sm]/card:text-sm",
        className,
      )}
      data-slot="card-title"
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      data-slot="card-action"
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      data-slot="card-content"
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center rounded-b-xl px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4",
        className,
      )}
      data-slot="card-footer"
      {...props}
    />
  );
}

type SectionWrapProps = {
  heading: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  headingExtra?: React.ReactNode;
  stackHeadingChildren?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

function SectionWrap({
  heading,
  icon: Icon,
  subtitle,
  headingExtra,
  stackHeadingChildren = false,
  children,
  className,
  contentClassName,
}: SectionWrapProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div
          className={`${stackHeadingChildren ? "grid gap-5 md:flex md:gap-3" : "flex gap-3"} items-center justify-between`}
        >
          <div className="flex items-center gap-2 font-semibold text-lg">
            {Icon && <Icon className="size-4" />}
            {typeof heading === "string" ? (
              <CardTitle>{heading}</CardTitle>
            ) : (
              heading
            )}
          </div>
          {headingExtra && <div>{headingExtra}</div>}
        </div>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  SectionWrap,
};
