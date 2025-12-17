import { Bot, Minimize2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";

export type AiAssistantChatMessage = {
  id: number;
  type: "ai" | "user";
  message: string;
};

type AiSidebarChatProps = {
  chatMessages: AiAssistantChatMessage[];
  onCollapse: () => void;
};

export function AiSidebarChat({
  chatMessages,
  onCollapse,
}: AiSidebarChatProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="h-8 w-8"
          aria-label="Collapse AI Assistant"
        >
          <Minimize2 className="size-4" />
        </Button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-4 space-y-4">
        {chatMessages.map((message) => {
          if (message.type === "user") {
            return (
              <div key={message.id} className="flex gap-3 justify-end">
                <div className="flex-1 flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="size-4 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">{message.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Input Area */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything..."
            className="flex-1"
            disabled
          />
          <Button
            size="default"
            className="bg-foreground/80 text-background"
            disabled
          >
            Send
          </Button>
        </div>
      </div>
    </>
  );
}

