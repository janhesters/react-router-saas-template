import type {
  AgendaItem,
  AIMessage,
  CalenderEvent,
  FunnelUpdate,
} from "./types";

export const dummyFunnelUpdates: [FunnelUpdate, ...FunnelUpdate[]] = [
  {
    deadline: "EOD",
    description:
      "Awaiting offer acceptance for the Senior Product Manager role.",
    id: 1,
    priority: "High",
    title: "Offer Pending for Sarah Miller",
  },
];

export const dummyAgenda: [AgendaItem, ...AgendaItem[]] = [
  {
    completed: false,
    id: 1,
    task: "Review AI Candidate Profiles for Senior Software Engineer Role",
  },
  {
    completed: false,
    id: 2,
    task: "Schedule interview with candidate 'Alex Johnson'",
  },
];

export const dummyCalanderEvents: CalenderEvent[] = [
  {
    end: "2025-10-26T08:00:00",
    id: 1,
    start: "2025-10-26T07:00:00",
    title: "AI Candidate Screening",
  },
  {
    end: "2025-10-26T09:00:00",
    id: 2,
    start: "2025-10-26T08:00:00",
    title: "Team Sync: Q4 Agentic Features",
  },
];

export const dummyAIMessage: AIMessage[] = [
  {
    content: "Hello! I’m your AI Assistant. How can I help you today?",
    id: 1,
    role: "assistant",
  },
  {
    content: "Show me candidates for the Senior Software Engineer role.",
    id: 2,
    role: "user",
  },
  {
    content:
      "I’ve filtered the pipeline for Senior Software Engineer candidates. Alice Johnson is currently in the 'Applied' stage. Would you like me to summarize her profile?",
    id: 3,
    role: "assistant",
  },
];

export const dummyChartData = [
  {
    applications: 24,
    interviews: 8,
    name: "Mon",
    offers: 2,
  },
  {
    applications: 32,
    interviews: 12,
    name: "Tue",
    offers: 4,
  },
  {
    applications: 28,
    interviews: 10,
    name: "Wed",
    offers: 3,
  },
  {
    applications: 35,
    interviews: 15,
    name: "Thu",
    offers: 5,
  },
  {
    applications: 30,
    interviews: 11,
    name: "Fri",
    offers: 4,
  },
  {
    applications: 18,
    interviews: 6,
    name: "Sat",
    offers: 1,
  },
  {
    applications: 12,
    interviews: 3,
    name: "Sun",
    offers: 1,
  },
];
