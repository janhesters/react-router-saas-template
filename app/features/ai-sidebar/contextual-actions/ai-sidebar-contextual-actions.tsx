import { Calendar, FileText, Mail, UserPlus } from "lucide-react";

import { Button } from "~/components/ui/button";

export function AiSidebarContextualActions() {
  return (
    <div className="p-4 pt-0 space-y-2">
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
  );
}

