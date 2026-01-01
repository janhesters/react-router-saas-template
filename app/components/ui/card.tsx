import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className,
      )}
      data-slot="card"
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
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
      className={cn("leading-none font-semibold", className)}
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
      className={cn("px-6", className)}
      data-slot="card-content"
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      data-slot="card-footer"
      {...props}
    />
  );
}

type SectionWrapProps = {
  heading: ReactNode;
  icon?: LucideIcon;
  subtitle?: string;
  headingExtra?: ReactNode;
  stackHeadingChildren?: boolean;
  children: ReactNode;
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
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  SectionWrap,
};
