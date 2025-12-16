import { useState } from "react";
import {
  Bot,
  Calendar,
  FileText,
  Mail,
  UserPlus,
  Minimize2,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

export type AiAssistantChatMessage = {
  id: number;
  type: "ai" | "user";
  message: string;
};

export type AiAssistantSidebarProps = {
  chatMessages: AiAssistantChatMessage[];
};

export function AiAssistantSidebar({
  chatMessages,
}: AiAssistantSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Floating button when collapsed */}
      {isCollapsed && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleCollapse}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            aria-label="Open AI Assistant"
          >
            <Bot className="size-6" />
          </Button>
        </div>
      )}

      {/* Sidebar container - always in layout but hidden when collapsed */}
      <div
        className={cn(
          "bg-background border-l flex flex-col transition-all duration-200 ease-linear overflow-hidden",
          "self-stretch",
          isCollapsed ? "w-0 border-0" : "w-80",
        )}
      >
        {!isCollapsed && (
          <>
            {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
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
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything..."
            className="flex-1"
            disabled
          />
          <Button size="default" className="bg-foreground/80 text-background" disabled>
            Send
          </Button>
        </div>

        {/* Contextual Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Contextual Actions:
          </p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 h-auto py-2"
              disabled
            >
              <Calendar className="size-4" />
              <span className="text-xs">Schedule Interview</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 h-auto py-2"
              disabled
            >
              <FileText className="size-4" />
              <span className="text-xs">Summarize Candidate</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 h-auto py-2"
              disabled
            >
              <Mail className="size-4" />
              <span className="text-xs">Send To Marketplace</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 h-auto py-2"
              disabled
            >
              <UserPlus className="size-4" />
              <span className="text-xs">Move to Next Stage</span>
            </Button>
          </div>
        </div>
      </div>
          </>
        )}
    </div>
    </>
  );
}

