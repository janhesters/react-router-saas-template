import { Github, Linkedin, MessageSquare, Twitter } from "lucide-react";
import { useState } from "react";

import { AIAssistantPanel } from "./components/ai-assistant-panel";
import { CalendarView } from "./components/calendar-view";
import { DailyAgenda } from "./components/daily-agenda";
import { HiringGoalsCard } from "./components/hiring-goals-card";
import { QuickStatsCard } from "./components/quick-stats-card";
import { UrgentFunnelUpdates } from "./components/urgent-funnel-updates";
import {
  mockAgendaItems,
  mockAIMessages,
  mockCalendarEvents,
  mockContextualActions,
  mockFunnelUpdates,
  mockHiringGoals,
  mockPipelineStats,
} from "./mock-data";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

export function JobsAndClientsPage() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  return (
    <div className="flex flex-1">
      {/* Main Content Area - flexible width, with right padding for AI panel on lg screens */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6 lg:mr-72">
        {/* Top Row: Urgent Funnel Updates + Daily Agenda - horizontal on tablet+, vertical on mobile */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UrgentFunnelUpdates
            onActionClick={(update) => console.log("Action clicked:", update)}
            onUpdateClick={(update) => console.log("Update clicked:", update)}
            updates={mockFunnelUpdates}
          />
          <DailyAgenda items={mockAgendaItems} />
        </div>

        {/* Calendar View - full width */}
        <CalendarView events={mockCalendarEvents} />

        {/* Bottom Row: Hiring Goals + Quick Stats - horizontal on tablet+, vertical on mobile */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <HiringGoalsCard goals={mockHiringGoals} />
          <QuickStatsCard stats={mockPipelineStats} />
        </div>

        {/* Footer with Social Links */}
        <footer className="mt-4 flex items-center justify-between border-t pt-4">
          <div />
          <div className="flex items-center gap-4">
            <a
              aria-label="LinkedIn"
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="https://linkedin.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Linkedin className="size-5" />
            </a>
            <a
              aria-label="Twitter"
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="https://twitter.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Twitter className="size-5" />
            </a>
            <a
              aria-label="GitHub"
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="https://github.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github className="size-5" />
            </a>
          </div>
        </footer>
      </div>

      {/* AI Assistant Panel - Desktop: fixed position on the right, full height minus header */}
      <aside className="fixed top-[var(--header-height)] right-0 bottom-0 hidden w-72 border-l bg-background lg:flex lg:flex-col">
        <AIAssistantPanel
          contextualActions={mockContextualActions}
          messages={mockAIMessages}
        />
      </aside>

      {/* AI Assistant Panel - Mobile FAB */}
      <Button
        className={cn(
          "fixed right-4 bottom-4 z-40 size-14 rounded-full shadow-lg lg:hidden",
        )}
        onClick={() => setIsAIPanelOpen(true)}
        size="icon-lg"
      >
        <MessageSquare className="size-6" />
        <span className="sr-only">Open AI Assistant</span>
      </Button>

      {/* AI Assistant Panel - Mobile Sheet */}
      <Sheet onOpenChange={setIsAIPanelOpen} open={isAIPanelOpen}>
        <SheetContent className="w-full p-0 sm:max-w-md" side="right">
          <SheetHeader className="sr-only">
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>
          <AIAssistantPanel
            contextualActions={mockContextualActions}
            messages={mockAIMessages}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
