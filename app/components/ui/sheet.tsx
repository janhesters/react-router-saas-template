import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog as SheetPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "~/lib/utils";

const SheetContext = React.createContext<{ isOpen: boolean }>({
  isOpen: false,
});

function Sheet({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  defaultOpen,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen || false);

  const open = openProp !== undefined ? openProp : isOpen;

  const onOpenChange = React.useCallback(
    (value: boolean) => {
      if (openProp === undefined) {
        setIsOpen(value);
      }
      onOpenChangeProp?.(value);
    },
    [openProp, onOpenChangeProp],
  );

  return (
    <SheetContext.Provider value={{ isOpen: !!open }}>
      <SheetPrimitive.Root
        data-slot="sheet"
        onOpenChange={onOpenChange}
        open={open}
        {...props}
      >
        {children}
      </SheetPrimitive.Root>
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  const { isOpen } = React.useContext(SheetContext);

  return (
    <AnimatePresence>
      {isOpen && (
        <SheetPrimitive.Overlay
          asChild
          data-slot="sheet-overlay"
          forceMount
          {...props}
        >
          <motion.div
            animate={{ opacity: 1 }}
            className={cn("fixed inset-0 z-50 bg-black/50", className)}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          />
        </SheetPrimitive.Overlay>
      )}
    </AnimatePresence>
  );
}

const sheetVariants = {
  bottom: {
    animate: {
      filter: "blur(0px)",
      opacity: 1,
      transform: "perspective(500px) rotateX(0deg) scale(1) translateY(0)",
    },
    exit: {
      filter: "blur(8px)",
      opacity: 0,
      transform:
        "perspective(500px) rotateX(15deg) scale(0.8) translateY(100%)",
    },
    initial: {
      filter: "blur(8px)",
      opacity: 0,
      transform:
        "perspective(500px) rotateX(15deg) scale(0.8) translateY(100%)",
    },
  },
  left: {
    animate: {
      filter: "blur(0px)",
      opacity: 1,
      transform: "perspective(500px) rotateY(0deg) scale(1) translateX(0)",
    },
    exit: {
      filter: "blur(8px)",
      opacity: 0,
      transform:
        "perspective(500px) rotateY(15deg) scale(0.8) translateX(-100%)",
    },
    initial: {
      filter: "blur(8px)",
      opacity: 0,
      transform:
        "perspective(500px) rotateY(15deg) scale(0.8) translateX(-100%)",
    },
  },
  right: {
    animate: {
      filter: "blur(0px)",
      opacity: 1,
      transform: "perspective(500px) rotateY(0deg) scale(1) translateX(0)",
    },
    exit: {
      filter: "blur(8px)",
      opacity: 0,
      transform:
        "perspective(500px) rotateY(-15deg) scale(0.8) translateX(100%)",
    },
    initial: {
      filter: "blur(8px)",
      opacity: 0,
      transform:
        "perspective(500px) rotateY(-15deg) scale(0.8) translateX(100%)",
    },
  },
  top: {
    animate: {
      filter: "blur(0px)",
      opacity: 1,
      transform: "perspective(500px) rotateX(0deg) scale(1) translateY(0)",
    },
    exit: {
      filter: "blur(8px)",
      opacity: 0,
      transform:
        "perspective(500px) rotateX(-15deg) scale(0.8) translateY(-100%)",
    },
    initial: {
      filter: "blur(8px)",
      opacity: 0,
      transform:
        "perspective(500px) rotateX(-15deg) scale(0.8) translateY(-100%)",
    },
  },
};

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  const { isOpen } = React.useContext(SheetContext);

  return (
    <SheetPortal forceMount>
      <SheetOverlay className="backdrop-blur-sm" />
      <AnimatePresence>
        {isOpen && (
          <SheetPrimitive.Content
            asChild
            data-slot="sheet-content"
            forceMount
            {...props}
          >
            <motion.div
              animate="animate"
              className={cn(
                "bg-background fixed z-50 flex flex-col gap-4 shadow-lg",
                side === "right" &&
                  "inset-y-0 right-4 h-[calc(100dvh-2rem)] my-auto w-3/4 sm:max-w-sm rounded-3xl",
                side === "left" &&
                  "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
                side === "top" && "inset-x-0 top-0 h-auto border-b",
                side === "bottom" && "inset-x-0 bottom-0 h-auto border-t",
                className,
              )}
              exit="exit"
              initial="initial"
              transition={{ damping: 50, stiffness: 400, type: "spring" }}
              variants={sheetVariants[side]}
            >
              {children}
              <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            </motion.div>
          </SheetPrimitive.Content>
        )}
      </AnimatePresence>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-0 p-4", className)}
      data-slot="sheet-header"
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      data-slot="sheet-footer"
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn("text-foreground font-semibold", className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
