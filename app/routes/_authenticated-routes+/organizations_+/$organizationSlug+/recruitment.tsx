import { BarChart3, BotIcon, Target } from "lucide-react";
import { useState } from "react";
import { href } from "react-router";
import { toast } from "sonner";

import type { Route } from "./+types/recruitment";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { AIAssistantPanel } from "~/features/recruitment/ai-assistant-panel";
import { CalendarView } from "~/features/recruitment/calendar-view";
import { DailyAgenda } from "~/features/recruitment/daily-agenda";
import { UrgentFunnelUpdates } from "~/features/recruitment/urgent-funnel-updates";
import { getPageTitle } from "~/utils/get-page-title.server";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  const urgentUpdates = [
    {
      candidateName: "Sarah Miller",
      deadline: "2025-04-23T17:00:00Z",
      details:
        "Awaiting offer acceptance for the Senior Product Manager role. Deadline: EOD.",
      id: "1",
      position: "Senior Product Manager",
      priority: "high" as const,
    },
  ];

  const dailyAgenda = [
    {
      completed: false,
      id: "1",
      task: "Review AI Candidate Profiles for Senior Software Engineer Role",
      time: "09:00",
    },
    {
      completed: false,
      id: "2",
      task: "Schedule interview with candidate 'Alex Johnson'",
      time: "10:30",
    },
  ];

  const calendarEvents = [
    {
      endTime: "2024-10-26T10:00:00Z",
      id: "1",
      startTime: "2024-10-26T09:00:00Z",
      title: "AI Candidate Screening",
      type: "screening" as const,
    },
    {
      endTime: "2024-10-26T11:30:00Z",
      id: "2",
      startTime: "2024-10-26T10:30:00Z",
      title: "Team Sync: Q4 Agentic Features",
      type: "meeting" as const,
    },
  ];

  const aiMessages = [
    {
      content: "Hello! I'm your AI Assistant. How can I help you today?",
      id: "1",
      role: "assistant" as const,
      timestamp: new Date().toISOString(),
    },
    {
      content: "Show me candidates for the Senior Software Engineer role.",
      id: "2",
      role: "user" as const,
      timestamp: new Date().toISOString(),
    },
    {
      content:
        "I've filtered the pipeline for Senior Software Engineer candidates. Alice Johnson is currently in the 'Applied' stage. Would you like me to summarize her profile?",
      id: "3",
      role: "assistant" as const,
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    aiMessages,
    breadcrumb: {
      title: "Recruitment Dashboard",
      to: href("/organizations/:organizationSlug/recruitment", {
        organizationSlug: params.organizationSlug,
      }),
    },
    calendarEvents,
    dailyAgenda,
    pageTitle: getPageTitle(t, "Recruitment Dashboard"),
    urgentUpdates,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function RecruitmentRoute({ loaderData }: Route.ComponentProps) {
  const { urgentUpdates, dailyAgenda, calendarEvents, aiMessages } = loaderData;
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [tasks, setTasks] = useState(dailyAgenda);
  const [messages, setMessages] = useState(aiMessages);
  const [currentDate, setCurrentDate] = useState("Monday, October 26");
  const [dateIndex, setDateIndex] = useState(0);

  const dates = [
    "Sunday, October 25",
    "Monday, October 26",
    "Tuesday, October 27",
    "Wednesday, October 28",
    "Thursday, October 29",
  ];

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const handleSendMessage = (message: string) => {
    const userMessage = {
      content: message,
      id: String(messages.length + 1),
      role: "user" as const,
      timestamp: new Date().toISOString(),
    };

    const responses = [
      "I've analyzed the candidates. Alice Johnson has 5 years of experience in React and TypeScript. Would you like me to schedule an interview?",
      "I've updated the candidate status. Sarah Miller has been moved to the 'Offer Sent' stage.",
      "Based on the job requirements, I found 3 matching candidates. Would you like to see their profiles?",
      "Interview scheduled for tomorrow at 2 PM. Calendar invite sent to all participants.",
      "Candidate summary: Strong technical background with leadership experience. Fits the Senior Engineer role requirements.",
    ] as const;

    const randomIndex = Math.floor(Math.random() * responses.length);
    const randomResponse: string | undefined = responses[randomIndex];

    const assistantMessage = {
      content: randomResponse as string,
      id: String(messages.length + 2),
      role: "assistant" as const,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  const handlePreviousDay = () => {
    if (dateIndex > 0) {
      const newIndex = dateIndex - 1;
      setDateIndex(newIndex);
      setCurrentDate((dates[newIndex] ?? dates[0]) as string);
    }
  };

  const handleNextDay = () => {
    if (dateIndex < dates.length - 1) {
      const newIndex = dateIndex + 1;
      setDateIndex(newIndex);
      setCurrentDate((dates[newIndex] ?? dates[0]) as string);
    }
  };

  const handleToday = () => {
    setDateIndex(1);
    setCurrentDate((dates[1] ?? dates[0]) as string);
  };

  const handleScheduleInterview = () => {
    toast.success("Interview scheduled for Alice Johnson on Oct 28, 2:00 PM");
  };

  const handleSummarizeCandidate = () => {
    toast.success("Candidate summary generated and copied to clipboard");
  };

  const handleSendToMarketplace = () => {
    toast.success("Candidate profile sent to marketplace");
  };

  const handleMoveToNextStage = () => {
    toast.success("Candidate moved to Interview stage");
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <UrgentFunnelUpdates updates={urgentUpdates} />
          <DailyAgenda
            date="2025.04.23"
            items={tasks}
            onToggle={handleToggleTask}
          />
        </div>

        <CalendarView
          currentDate={currentDate}
          events={calendarEvents}
          onNextDay={handleNextDay}
          onPreviousDay={handlePreviousDay}
          onToday={handleToday}
        />

        <div className="mt-auto flex items-center justify-center gap-8 py-8">
          <Target
            className="size-16 text-muted-foreground/20"
            strokeWidth={1}
          />
          <BarChart3
            className="size-16 text-muted-foreground/20"
            strokeWidth={1}
          />
        </div>
      </div>

      <div className="hidden w-80 lg:block">
        <AIAssistantPanel
          messages={messages}
          onMoveToNextStage={handleMoveToNextStage}
          onScheduleInterview={handleScheduleInterview}
          onSendMessage={handleSendMessage}
          onSendToMarketplace={handleSendToMarketplace}
          onSummarizeCandidate={handleSummarizeCandidate}
        />
      </div>

      <Sheet onOpenChange={setIsAIOpen} open={isAIOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-4 right-4 size-14 rounded-full shadow-lg lg:hidden"
            size="icon"
          >
            <BotIcon className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full p-0 sm:max-w-md" side="right">
          <div className="h-full">
            <AIAssistantPanel
              messages={messages}
              onMoveToNextStage={handleMoveToNextStage}
              onScheduleInterview={handleScheduleInterview}
              onSendMessage={handleSendMessage}
              onSendToMarketplace={handleSendToMarketplace}
              onSummarizeCandidate={handleSummarizeCandidate}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
