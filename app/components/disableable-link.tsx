import type { LinkProps } from "react-router";
import { Link } from "react-router";

import { cn } from "~/lib/utils";

export type DisableableLinkComponentProps = LinkProps & { disabled?: boolean };

export function DisableableLink(props: DisableableLinkComponentProps) {
  const { children, className, disabled, ...rest } = props;

  return disabled ? (
    <span
      aria-disabled="true"
      className={cn("pointer-events-none", className)}
      tabIndex={-1}
      {...rest}
    >
      {children}
    </span>
  ) : (
    <Link {...rest}>{children}</Link>
  );
}
