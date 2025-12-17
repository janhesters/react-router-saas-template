/**
 * Types for the Jobs and Clients dashboard feature
 */

/**
 * Priority levels for funnel updates
 */
export type FunnelUpdatePriority = "high" | "medium" | "low";

/**
 * Urgent Funnel Update item
 * Represents a pending action requiring attention in the recruitment pipeline
 */
export interface FunnelUpdate {
  id: string;
  title: string;
  description: string;
  priority: FunnelUpdatePriority;
  actionLabel: string;
  candidateName?: string;
  roleName?: string;
  deadline?: string;
}

/**
 * Daily Agenda Item
 * Represents a task in the daily to-do list
 */
export interface AgendaItem {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * Calendar Event types
 */
export type CalendarEventType = "screening" | "interview" | "meeting" | "sync";

/**
 * Calendar Event
 * Represents a scheduled event in the calendar view
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type?: CalendarEventType;
}

/**
 * AI Message roles
 */
export type AIMessageRole = "user" | "assistant";

/**
 * AI Message
 * Represents a message in the AI Assistant conversation
 */
export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: Date;
}

/**
 * Contextual Action
 * Represents a quick action button in the AI Assistant panel
 */
export interface ContextualAction {
  id: string;
  label: string;
  icon: string;
  action: string;
}

/**
 * Hiring Goal
 * Represents a placement/hiring target
 */
export interface HiringGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  period: string;
}

/**
 * Pipeline Stat
 * Represents a key metric in the pipeline overview
 */
export interface PipelineStat {
  id: string;
  label: string;
  value: number | string;
  change?: number;
}
