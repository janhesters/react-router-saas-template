import { Bot } from "lucide-react";

import { Button } from "~/components/ui/button";

type AiSidebarBubbleProps = {
  onOpen: () => void;
};

export function AiSidebarBubble({ onOpen }: AiSidebarBubbleProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={onOpen}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        aria-label="Open AI Assistant"
      >
        <Bot className="size-6" />
      </Button>
    </div>
  );
}

