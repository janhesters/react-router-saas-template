import { Calendar, FileText, Mail, Send, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
};

type AIAssistantPanelProps = {
  messages: Message[];
  onSendMessage?: (message: string) => void;
  onScheduleInterview?: () => void;
  onSummarizeCandidate?: () => void;
  onSendToMarketplace?: () => void;
  onMoveToNextStage?: () => void;
};

export function AIAssistantPanel({
  messages,
  onSendMessage,
  onScheduleInterview,
  onSummarizeCandidate,
  onSendToMarketplace,
  onMoveToNextStage,
}: AIAssistantPanelProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex h-full flex-col border-l bg-muted/30">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              key={message.id}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-t p-4">
        <div className="space-y-2">
          <Textarea
            className="min-h-20 resize-none"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            value={input}
          />
          <Button className="w-full" onClick={handleSend}>
            <Send className="mr-2 size-4" />
            Send
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Contextual Actions:
          </p>
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              onClick={onScheduleInterview}
              variant="outline"
            >
              <Calendar className="mr-2 size-4" />
              Schedule Interview
            </Button>
            <Button
              className="w-full justify-start"
              onClick={onSummarizeCandidate}
              variant="outline"
            >
              <FileText className="mr-2 size-4" />
              Summarize Candidate
            </Button>
            <Button
              className="w-full justify-start"
              onClick={onSendToMarketplace}
              variant="outline"
            >
              <Mail className="mr-2 size-4" />
              Send To Marketplace
            </Button>
            <Button
              className="w-full justify-start"
              onClick={onMoveToNextStage}
              variant="outline"
            >
              <UserPlus className="mr-2 size-4" />
              Move to Next Stage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
