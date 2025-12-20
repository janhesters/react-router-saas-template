import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconLoader,
} from "@tabler/icons-react";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

import { useColorScheme } from "~/features/color-scheme/use-color-scheme";

const Toaster = ({ ...props }: ToasterProps) => {
  const colorScheme = useColorScheme();

  return (
    <Sonner
      className="toaster group"
      icons={{
        error: <IconAlertOctagon className="size-4" />,
        info: <IconInfoCircle className="size-4" />,
        loading: <IconLoader className="size-4 animate-spin" />,
        success: <IconCircleCheck className="size-4" />,
        warning: <IconAlertTriangle className="size-4" />,
      }}
      style={
        {
          "--border-radius": "var(--radius)",
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      theme={colorScheme as ToasterProps["theme"]}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
