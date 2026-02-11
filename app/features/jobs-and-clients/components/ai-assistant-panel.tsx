import {
  ArrowRight,
  Bot,
  CalendarPlus,
  FileText,
  Send,
  User,
} from "lucide-react";
import { useState } from "react";

import { mockAIResponses } from "../mock-data";
import type { AIMessage, ContextualAction } from "../types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

interface AIAssistantPanelProps {
  messages: AIMessage[];
  contextualActions: ContextualAction[];
}

const actionIcons: Record<string, React.ElementType> = {
  ArrowRight,
  CalendarPlus,
  FileText,
  Send,
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AIAssistantPanel({
  messages: initialMessages,
  contextualActions,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: AIMessage = {
      content: inputValue,
      id: `msg-${Date.now()}`,
      role: "user",
      timestamp: new Date(),
    };

    const assistantMessage: AIMessage = {
      content:
        "I understand your request. Let me help you with that. This is a mock response for demonstration purposes.",
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue("");
  };

  const handleActionClick = (action: ContextualAction) => {
    const response =
      mockAIResponses[action.action] || "Processing your request...";

    const assistantMessage: AIMessage = {
      content: response,
      id: `msg-${Date.now()}`,
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4">
        <Bot className="size-5 text-primary" />
        <h2 className="font-mono text-lg font-semibold">AI Assistant</h2>
      </div>

      <Separator />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              className={cn(
                "flex gap-2",
                message.role === "user" && "flex-row-reverse",
              )}
              key={message.id}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {message.role === "assistant" ? (
                  <Bot className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "flex max-w-[80%] flex-col gap-1 rounded-lg px-3 py-2",
                  message.role === "assistant"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <p className="text-sm">{message.content}</p>
                <span
                  className={cn(
                    "text-xs",
                    message.role === "assistant"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70",
                  )}
                >
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Contextual Actions */}
      <div className="p-3">
        <p className="mb-2 text-muted-foreground text-xs">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {contextualActions.map((action) => {
            const IconComponent = actionIcons[action.icon] || FileText;
            return (
              <Button
                className="h-auto gap-1.5 px-2.5 py-1.5 text-xs"
                key={action.id}
                onClick={() => handleActionClick(action)}
                size="sm"
                variant="outline"
              >
                <IconComponent className="size-3.5" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Input */}
      <div className="flex gap-2 p-4">
        <Input
          className="flex-1"
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          value={inputValue}
        />
        <Button
          disabled={!inputValue.trim()}
          onClick={handleSendMessage}
          size="icon"
        >
          <Send className="size-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
