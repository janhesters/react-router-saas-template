import { SendIcon, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
};

const QUICK_PROMPTS = [
  "Help me find candidates",
  "Analyze job requirements",
  "Suggest interview questions",
];

const MOCK_AI_RESPONSES = [
  "I can help you with that! Based on the current job postings, I recommend looking at candidates with strong technical backgrounds and proven experience in similar roles.",
  "Great question! The key requirements for this role include excellent communication skills, 5+ years of industry experience, and proficiency with modern development frameworks.",
  "Here are some suggested interview questions: 1) Tell me about your most challenging project, 2) How do you stay updated with industry trends?, 3) Describe your approach to problem-solving.",
];

export function AiAssistantSheet() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      content: "Hello! I'm your AI assistant. How can I help you today?",
      id: "1",
      role: "ai",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  //   biome-ignore lint/correctness/useExhaustiveDependencies: messages dependency is required for scrolling to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      content: content.trim(),
      id: Date.now().toString(),
      role: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * MOCK_AI_RESPONSES.length);
      const responseContent = MOCK_AI_RESPONSES[randomIndex];
      if (responseContent === undefined) return;

      const aiMessage: ChatMessage = {
        content: responseContent,
        id: (Date.now() + 1).toString(),
        role: "ai",
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg shadow-primary/20"
        onClick={() => setOpen(true)}
        size="icon"
      >
        <Sparkles />
      </Button>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent
          aria-describedby={undefined}
          className="flex flex-col overflow-hidden sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  className={cn(
                    "flex justify-start data-[role=user]:justify-end",
                  )}
                  data-role={message.role}
                  key={message.id}
                >
                  <div
                    className={cn(
                      "max-w-xs rounded-xl px-4 py-2 bg-muted text-muted-foreground",
                      "data-[role=user]:bg-primary data-[role=user]:text-primary-foreground",
                    )}
                    data-role={message.role}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <div className="space-y-2 border-t px-6 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Quick prompts:
              </p>
              <div className="flex flex-col gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <Button
                    className="justify-start"
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    size="sm"
                    variant="outline"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t px-6 pt-5 pb-5">
            <div className="flex gap-2">
              <Textarea
                className="min-h-12 max-h-32 resize-none"
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                value={inputValue}
              />
              <Button
                className=""
                onClick={() => handleSendMessage(inputValue)}
                size="icon"
              >
                <SendIcon className="size-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
