/**
 * Constants and type definitions for the Jobs and Clients feature
 */

// Urgency levels
export const URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

// Funnel update statuses
export const FUNNEL_UPDATE_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "expired",
] as const;
export type FunnelUpdateStatus = (typeof FUNNEL_UPDATE_STATUSES)[number];

// Agenda item statuses
export const AGENDA_ITEM_STATUSES = [
  "pending",
  "completed",
  "cancelled",
] as const;
export type AgendaItemStatus = (typeof AGENDA_ITEM_STATUSES)[number];

// Related entity types for agenda items
export const AGENDA_RELATED_ENTITY_TYPES = [
  "candidate",
  "job",
  "interview",
] as const;
export type AgendaRelatedEntityType =
  (typeof AGENDA_RELATED_ENTITY_TYPES)[number];

// Calendar event types
export const CALENDAR_EVENT_TYPES = [
  "interview",
  "meeting",
  "screening",
  "sync",
  "other",
] as const;
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

// Related entity types for calendar events
export const CALENDAR_RELATED_ENTITY_TYPES = ["candidate", "job"] as const;
export type CalendarRelatedEntityType =
  (typeof CALENDAR_RELATED_ENTITY_TYPES)[number];

// Performance metric periods
export const PERFORMANCE_METRIC_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
] as const;
export type PerformanceMetricPeriod =
  (typeof PERFORMANCE_METRIC_PERIODS)[number];

// Chat message roles
export const CHAT_MESSAGE_ROLES = ["user", "assistant", "system"] as const;
export type ChatMessageRole = (typeof CHAT_MESSAGE_ROLES)[number];

// Jobs and Clients action intents
export const jobsAndClientsIntents = {
  addOrEditEvent: "add-or-edit-event",
  sendReminder: "send-reminder",
  toggleAgendaItem: "toggle-agenda-item",
} as const;

// Type definitions
export type UrgentFunnelUpdate = {
  id: string;
  candidateName: string;
  roleTitle: string;
  status: FunnelUpdateStatus;
  urgency: UrgencyLevel;
  deadline: string; // ISO string
  message: string;
  organizationId: string;
  reminderSentAt?: string | null; // ISO string
};

export type AgendaItem = {
  id: string;
  title: string;
  scheduledTime: string; // ISO string
  status: AgendaItemStatus;
  description?: string;
  relatedEntityId?: string;
  relatedEntityType?: AgendaRelatedEntityType;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  description?: string;
  type: CalendarEventType;
  participants?: string[];
  relatedEntityId?: string;
  relatedEntityType?: CalendarRelatedEntityType;
};

export type PerformanceMetric = {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  period: PerformanceMetricPeriod;
};

export type GrowthTrendDataPoint = {
  period: string;
  value: number;
  label: string;
};

export type GrowthTrend = {
  id: string;
  metric: string;
  dataPoints: GrowthTrendDataPoint[];
  comparison?: {
    previousPeriod: number;
    changePercentage: number;
  };
};

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string; // ISO string
  metadata?: {
    relatedEntityId?: string;
    relatedEntityType?: string;
    actionTaken?: boolean;
  };
};

export type ContextualAction = {
  id: string;
  label: string;
  icon: string;
  action: string;
  requiresContext?: boolean;
};

export type JobsAndClientsData = {
  urgentFunnelUpdates: UrgentFunnelUpdate[];
  dailyAgenda: AgendaItem[];
  calendarEvents: CalendarEvent[];
  performanceMetrics: PerformanceMetric[];
  growthTrends: GrowthTrend[];
  chatMessages: ChatMessage[];
  contextualActions: ContextualAction[];
};
