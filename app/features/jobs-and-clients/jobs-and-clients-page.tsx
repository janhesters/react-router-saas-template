import { MessageSquare } from "lucide-react";
import { useState } from "react";

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
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

/**
 * Placeholder components - will be replaced with actual implementations
 */
function AIAssistantPanelPlaceholder() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <h2 className="font-mono text-lg font-semibold">AI Assistant</h2>
      </div>
      <Separator />
      <div className="flex-1 p-4">
        <p className="text-muted-foreground text-sm">
          {mockAIMessages.length} messages
        </p>
      </div>
      <Separator />
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          {mockContextualActions.length} actions
        </p>
      </div>
    </div>
  );
}

export function JobsAndClientsPage() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  return (
    <div className="flex flex-1">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        {/* Top Row: Urgent Funnel Updates + Daily Agenda */}
        <div className="grid gap-4 lg:grid-cols-2">
          <UrgentFunnelUpdates
            onActionClick={(update) => console.log("Action clicked:", update)}
            onUpdateClick={(update) => console.log("Update clicked:", update)}
            updates={mockFunnelUpdates}
          />
          <DailyAgenda items={mockAgendaItems} />
        </div>

        {/* Calendar View */}
        <CalendarView events={mockCalendarEvents} />

        {/* Bottom Row: Hiring Goals + Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <HiringGoalsCard goals={mockHiringGoals} />
          <QuickStatsCard stats={mockPipelineStats} />
        </div>
      </div>

      {/* AI Assistant Panel - Desktop (always visible) */}
      <aside className="hidden w-80 shrink-0 border-l bg-background xl:block">
        <AIAssistantPanelPlaceholder />
      </aside>

      {/* AI Assistant Panel - Mobile FAB */}
      <Button
        className={cn(
          "fixed right-4 bottom-4 z-40 size-14 rounded-full shadow-lg xl:hidden",
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
          <AIAssistantPanelPlaceholder />
        </SheetContent>
      </Sheet>
    </div>
  );
}
