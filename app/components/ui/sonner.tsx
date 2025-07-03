import type { ToasterProps } from 'sonner';
import { Toaster as Sonner } from 'sonner';

import { useColorScheme } from '~/features/color-scheme/use-color-scheme';

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useColorScheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
