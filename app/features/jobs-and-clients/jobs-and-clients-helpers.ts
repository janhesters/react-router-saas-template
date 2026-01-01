/**
 * Helper functions for Jobs and Clients feature
 */

import {
  addDays as dateFnsAddDays,
  subDays as dateFnsSubDays,
  format,
} from "date-fns";

import type {
  AgendaItem,
  CalendarEvent,
  PerformanceMetric,
  UrgentFunnelUpdate,
} from "./jobs-and-clients-constants";

/**
 * Formats a date to display as "Day, Month Day" (e.g., "Monday, October 26")
 */
export function formatCalendarDate(date: Date): string {
  return format(date, "EEEE, MMMM d");
}

/**
 * Formats a time to 12-hour format (e.g., "09:00 AM", "02:00 PM")
 */
export function formatTime12Hour(date: Date): string {
  return format(date, "h:mm a");
}

/**
 * Formats a time range (e.g., "09:00 AM - 10:00 AM")
 */
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`;
}

/**
 * Formats a date for the daily agenda header (e.g., "2025.04.23")
 */
export function formatAgendaDate(date: Date): string {
  return format(date, "yyyy.MM.dd");
}

/**
 * Gets the hour index (0-23) for a given date
 */
export function getHourIndex(date: Date): number {
  return date.getHours();
}

/**
 * Formats hour index to 12-hour format string
 */
export function formatHourIndex(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

/**
 * Checks if a calendar event falls within a specific hour
 */
export function isEventInHour(event: CalendarEvent, hour: number): boolean {
  const eventStartHour = getHourIndex(new Date(event.startTime));
  return eventStartHour === hour;
}

/**
 * Gets all events for a specific date, grouped by hour
 */
export function getEventsByHour(
  events: CalendarEvent[],
  date: Date,
): Map<number, CalendarEvent[]> {
  const eventsForDate = events.filter((event) => {
    const eventDate = new Date(event.startTime);
    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    );
  });

  const eventsByHour = new Map<number, CalendarEvent[]>();

  eventsForDate.forEach((event) => {
    const hour = getHourIndex(new Date(event.startTime));
    const existing = eventsByHour.get(hour) || [];
    eventsByHour.set(hour, [...existing, event]);
  });

  return eventsByHour;
}

/**
 * Gets agenda items for a specific date
 */
export function getAgendaItemsForDate(
  items: AgendaItem[],
  date: Date,
): AgendaItem[] {
  return items.filter((item) => {
    const itemDate = new Date(item.scheduledTime);
    return (
      itemDate.getFullYear() === date.getFullYear() &&
      itemDate.getMonth() === date.getMonth() &&
      itemDate.getDate() === date.getDate()
    );
  });
}

/**
 * Sorts agenda items by scheduled time
 */
export function sortAgendaItemsByTime(items: AgendaItem[]): AgendaItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
  );
}

/**
 * Sorts agenda items by priority for dashboard display:
 * 1. Pending items first, sorted by time ascending (earliest first)
 * 2. Completed items second, sorted by time descending (most recent first)
 */
export function sortAgendaItemsByPriority(items: AgendaItem[]): AgendaItem[] {
  const pending = items.filter((item) => item.status === "pending");
  const completed = items.filter((item) => item.status === "completed");

  const sortedPending = [...pending].sort(
    (a, b) =>
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
  );

  const sortedCompleted = [...completed].sort(
    (a, b) =>
      new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime(),
  );

  return [...sortedPending, ...sortedCompleted];
}

/**
 * Gets urgent funnel updates sorted by urgency and deadline
 */
/**
 * Checks if a reminder was sent within the last 30 minutes
 */
export function isReminderSentRecently(
  reminderSentAt: string | null | undefined,
): boolean {
  if (!reminderSentAt) return false;
  const now = new Date();
  const reminderTime = new Date(reminderSentAt);
  const diffInMinutes = (now.getTime() - reminderTime.getTime()) / (1000 * 60);
  return diffInMinutes <= 30;
}

/**
 * Sorts funnel updates by reminder status (not sent takes priority), then by deadline (closer deadline = higher priority)
 */
export function sortFunnelUpdatesByUrgency(
  updates: UrgentFunnelUpdate[],
): UrgentFunnelUpdate[] {
  return [...updates].sort((a, b) => {
    // First, sort by reminder status: not sent takes priority
    const aReminderSent = isReminderSentRecently(a.reminderSentAt);
    const bReminderSent = isReminderSentRecently(b.reminderSentAt);

    if (aReminderSent !== bReminderSent) {
      // If a has reminder sent and b doesn't, b comes first (priority)
      return aReminderSent ? 1 : -1;
    }

    // Then sort by deadline: closer deadline = higher priority (comes first)
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

/**
 * Calculates performance metric percentage
 */
export function calculateMetricPercentage(metric: PerformanceMetric): number {
  if (metric.target === 0) return 0;
  return Math.round((metric.value / metric.target) * 100);
}

/**
 * Formats a percentage value
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}

/**
 * Gets the change indicator (positive/negative) for growth trends
 */
export function getGrowthChangeIndicator(changePercentage: number): {
  isPositive: boolean;
  formatted: string;
} {
  const isPositive = changePercentage >= 0;
  const sign = isPositive ? "+" : "";
  return {
    formatted: `${sign}${changePercentage.toFixed(1)}%`,
    isPositive,
  };
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Gets the start of day for a given date
 */
export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of day for a given date
 */
export function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Adds days to a date
 */
export function addDays(date: Date, days: number): Date {
  return dateFnsAddDays(date, days);
}

/**
 * Subtracts days from a date
 */
export function subtractDays(date: Date, days: number): Date {
  return dateFnsSubDays(date, days);
}
