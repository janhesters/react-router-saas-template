import type {
  AgendaItem,
  AIMessage,
  CalendarEvent,
  ContextualAction,
  FunnelUpdate,
  HiringGoal,
  PipelineStat,
} from "./types";

/**
 * Helper to get today's date at a specific time
 */
function getTodayAt(hours: number, minutes: number): Date {
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  return today;
}

/**
 * Urgent Funnel Updates - 5 items with varied priorities and actions
 */
export const mockFunnelUpdates: FunnelUpdate[] = [
  {
    actionLabel: "Send Reminder",
    candidateName: "Sarah Miller",
    deadline: "EOD",
    description:
      "Awaiting offer acceptance for the Senior Product Manager role. Deadline: EOD.",
    id: "fu-1",
    priority: "high",
    roleName: "Senior Product Manager",
    title: "Offer Pending for Sarah Miller",
  },
  {
    actionLabel: "Request Feedback",
    candidateName: "John Chen",
    description:
      "John Chen's technical interview feedback is pending from the engineering team.",
    id: "fu-2",
    priority: "high",
    roleName: "Senior Software Engineer",
    title: "Interview Feedback Due",
  },
  {
    actionLabel: "Start Check",
    candidateName: "Emily Davis",
    description:
      "Emily Davis has passed all interviews. Reference check needed before final offer.",
    id: "fu-3",
    priority: "medium",
    roleName: "UX Designer",
    title: "Reference Check Required",
  },
  {
    actionLabel: "Schedule Call",
    candidateName: "Michael Brown",
    description:
      "Michael Brown's placement contract expires in 5 days. Renewal discussion needed.",
    id: "fu-4",
    priority: "medium",
    roleName: "DevOps Engineer",
    title: "Contract Expiring Soon",
  },
  {
    actionLabel: "Follow Up",
    candidateName: "Lisa Wang",
    description:
      "Lisa Wang hasn't responded to the initial outreach. Consider a follow-up.",
    id: "fu-5",
    priority: "low",
    roleName: "Data Analyst",
    title: "Candidate Follow-up Needed",
  },
];

/**
 * Daily Agenda Items - 5 tasks
 */
export const mockAgendaItems: AgendaItem[] = [
  {
    completed: false,
    id: "agenda-1",
    title: "Review AI Candidate Profiles for Senior Software Engineer Role",
  },
  {
    completed: false,
    id: "agenda-2",
    title: "Schedule interview with candidate 'Alex Johnson'",
  },
  {
    completed: true,
    id: "agenda-3",
    title: "Send offer letter to Sarah Miller",
  },
  {
    completed: false,
    id: "agenda-4",
    title: "Update pipeline metrics for Q4 report",
  },
  {
    completed: true,
    id: "agenda-5",
    title: "Prepare for Team Sync meeting",
  },
];

/**
 * Calendar Events - 2 events as shown in the mockup
 */
export const mockCalendarEvents: CalendarEvent[] = [
  {
    end: getTodayAt(10, 0),
    id: "event-1",
    start: getTodayAt(9, 0),
    title: "AI Candidate Screening",
    type: "screening",
  },
  {
    end: getTodayAt(11, 30),
    id: "event-2",
    start: getTodayAt(10, 30),
    title: "Team Sync: Q4 Agentic Features",
    type: "sync",
  },
];

/**
 * AI Conversation Messages
 */
export const mockAIMessages: AIMessage[] = [
  {
    content: "Hello! I'm your AI Assistant. How can I help you today?",
    id: "msg-1",
    role: "assistant",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    content: "Show me candidates for the Senior Software Engineer role.",
    id: "msg-2",
    role: "user",
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
  },
  {
    content:
      "I've filtered the pipeline for Senior Software Engineer candidates. Alice Johnson is currently in the 'Applied' stage. Would you like me to summarize her profile?",
    id: "msg-3",
    role: "assistant",
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
  },
];

/**
 * Contextual Actions for AI Panel
 */
export const mockContextualActions: ContextualAction[] = [
  {
    action: "schedule_interview",
    icon: "CalendarPlus",
    id: "action-1",
    label: "Schedule Interview",
  },
  {
    action: "summarize_candidate",
    icon: "FileText",
    id: "action-2",
    label: "Summarize Candidate",
  },
  {
    action: "send_to_marketplace",
    icon: "Send",
    id: "action-3",
    label: "Send To Marketplace",
  },
  {
    action: "move_to_next_stage",
    icon: "ArrowRight",
    id: "action-4",
    label: "Move to Next Stage",
  },
];

/**
 * Hiring Goals
 */
export const mockHiringGoals: HiringGoal[] = [
  {
    current: 3,
    id: "goal-1",
    period: "this month",
    target: 5,
    title: "Senior Engineers",
  },
];

/**
 * Pipeline Stats
 */
export const mockPipelineStats: PipelineStat[] = [
  {
    change: 12,
    id: "stat-1",
    label: "Candidates in Pipeline",
    value: 24,
  },
  {
    change: -5,
    id: "stat-2",
    label: "Interviews This Week",
    value: 8,
  },
  {
    id: "stat-3",
    label: "Offers Pending",
    value: 3,
  },
];

/**
 * AI Response templates for contextual actions
 */
export const mockAIResponses: Record<string, string> = {
  move_to_next_stage:
    "I'll advance the selected candidate to the next stage in the pipeline. Please confirm which candidate you'd like to move forward.",
  schedule_interview:
    "I'll help you schedule an interview. Please select a candidate and preferred time slot, and I'll coordinate with all parties.",
  send_to_marketplace:
    "I'll prepare the candidate profile for the marketplace. This will make them visible to other recruiters in the network.",
  summarize_candidate:
    "I can summarize any candidate's profile for you. Which candidate would you like me to focus on?",
};
