import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

import { useColorScheme } from "~/features/color-scheme/use-color-scheme";

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useColorScheme();

  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      {...props}
    />
  );
};

export { Toaster };
