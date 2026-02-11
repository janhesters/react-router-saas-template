import { Calendar, GroupIcon, Mail, Notebook } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

function AssistantSuggestion({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-black p-3 text-sm hover:bg-muted transition-colors bg-white flex gap-3 items-center">
      {children}
    </div>
  );
}

export default function AIAssistantPanel() {
  return (
    <Card className="h-full bg-gray-100 rounded-none border-l border-black">
      <CardHeader>
        <CardTitle className="text-base font-semibold">AI Assistant</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col h-full">
        <div className="flex-1 space-y-4 pb-10 xl:pb-0">
          <p className="text-sm text-muted-foreground">
            Hello! I'm your AI Assistant. How can I help you today?
          </p>
          <p className="text-sm text-muted-foreground">
            Show me the candidates for the Senior Software Engineer role.
          </p>
          <p className="text-sm text-muted-foreground">
            I've filtered the pipeline for Senior Software Engineer candidates.
            Alice Johnson is currently in the "Applied" stage. Would you like me
            to summarize her profile?
          </p>
        </div>

        <div>
          <div className="grid gap-2 border-b border-black pb-4">
            <Input
              className="bg-white rounded"
              placeholder="Ask me anything..."
              type="text"
            />
            <Button className="w-full rounded-none bg-gray-600">Send</Button>
          </div>

          <div className="space-y-2 pt-4">
            <p className="text-base lg:text-xl">Contextual Actions:</p>

            <AssistantSuggestion>
              <Calendar size={14} />
              Schedule Interview
            </AssistantSuggestion>

            <AssistantSuggestion>
              <Notebook size={14} />
              Summarize Interview
            </AssistantSuggestion>

            <AssistantSuggestion>
              <Mail size={14} />
              Send To Marketplace
            </AssistantSuggestion>

            <AssistantSuggestion>
              <GroupIcon />
              Move To Next Stage
            </AssistantSuggestion>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
