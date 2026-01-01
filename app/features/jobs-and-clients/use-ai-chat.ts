/**
 * Custom hook for AI chat functionality
 */

import { useCallback, useState } from "react";

import type { ChatMessage } from "./jobs-and-clients-constants";

export function useAiChat(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        content: content.trim(),
        id: `msg-${Date.now()}-user`,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate API call - replace with actual API call
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          content: `I received your message: "${content.trim()}". This is a mock response.`,
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    },
    [isLoading],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    clearMessages,
    isLoading,
    messages,
    sendMessage,
  };
}
