/**
 * AI Assistant Sidebar Component
 *
 * Displays the AI chat interface with messages, input, and contextual actions
 */

import {
  IconBell,
  IconCalendar,
  IconCheck,
  IconTrendingUp,
} from "@tabler/icons-react";

import type {
  ChatMessage,
  ContextualAction,
} from "./jobs-and-clients-constants";
import { useAiChat } from "./use-ai-chat";
import { useAutoResizeTextarea } from "./use-auto-resize-textarea";
import { Button } from "~/components/ui/button";
import { SectionWrap } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

export type AiAssistantSidebarProps = {
  initialMessages: ChatMessage[];
  contextualActions: ContextualAction[];
  onContextualAction?: (action: string) => void;
};

export function AiAssistantSidebar({
  initialMessages,
  contextualActions,
  onContextualAction,
}: AiAssistantSidebarProps) {
  // AI Chat
  const { messages, sendMessage, isLoading } = useAiChat(initialMessages);

  // Textarea auto-resize
  const { handleInput } = useAutoResizeTextarea();

  // Handle chat message send
  const handleSendChatMessage = () => {
    const textarea = document.querySelector(
      'textarea[placeholder="Ask me anything..."]',
    ) as HTMLTextAreaElement;
    if (textarea?.value.trim()) {
      sendMessage(textarea.value);
      textarea.value = "";
      textarea.style.height = "auto";
    }
  };

  // Handle contextual action
  const handleContextualAction = (action: string): void => {
    onContextualAction?.(action);
  };

  return (
    <SectionWrap
      className="h-full"
      contentClassName="flex h-[calc(100%-5rem)] flex-col px-4"
      heading="AI Assistant"
    >
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            className={cn(
              "rounded-lg p-3",
              message.role === "user"
                ? "ml-auto max-w-[80%] bg-primary text-primary-foreground"
                : "bg-muted",
            )}
            key={message.id}
          >
            <p className="text-sm">{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">Thinking...</p>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Textarea
            className="resize-none overflow-auto min-h-[2.5rem] max-h-[7.5rem]"
            disabled={isLoading}
            onInput={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendChatMessage();
              }
            }}
            placeholder="Ask me anything..."
            rows={1}
          />
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={handleSendChatMessage}
            size="sm"
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
        <div className="border-t pt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Contextual Actions:
          </p>
          <div className="flex flex-col gap-2">
            {contextualActions.map((action) => {
              // Map icon string to actual icon component
              const IconComponent =
                action.icon === "CalendarIcon"
                  ? IconCalendar
                  : action.icon === "CheckIcon"
                    ? IconCheck
                    : action.icon === "BellIcon"
                      ? IconBell
                      : action.icon === "TrendingUpIcon"
                        ? IconTrendingUp
                        : IconCheck;

              return (
                <Button
                  className="h-auto flex items-center justify-start gap-2 py-2 px-6!"
                  key={action.id}
                  onClick={() => handleContextualAction(action.action)}
                  size="sm"
                  variant="outline"
                >
                  <IconComponent className="size-4" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}
