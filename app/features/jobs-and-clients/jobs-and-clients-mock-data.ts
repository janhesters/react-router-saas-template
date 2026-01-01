/**
 * Mock data generators for Jobs and Clients feature
 */

import { addDays, format, subMonths } from "date-fns";

import type {
  AgendaItem,
  CalendarEvent,
  ChatMessage,
  ContextualAction,
  GrowthTrend,
  GrowthTrendDataPoint,
  PerformanceMetric,
  UrgentFunnelUpdate,
} from "./jobs-and-clients-constants";
import {
  AGENDA_ITEM_STATUSES,
  CALENDAR_EVENT_TYPES,
  CALENDAR_RELATED_ENTITY_TYPES,
  CHAT_MESSAGE_ROLES,
  FUNNEL_UPDATE_STATUSES,
  PERFORMANCE_METRIC_PERIODS,
  URGENCY_LEVELS,
} from "./jobs-and-clients-constants";

/**
 * Creates mock urgent funnel updates
 */
export function createMockUrgentFunnelUpdates(): UrgentFunnelUpdate[] {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return [
    {
      candidateName: "Sarah Miller",
      deadline: endOfDay.toISOString(),
      id: "funnel-1",
      message:
        "Awaiting offer acceptance for the Senior Product Manager role. Deadline: EOD.",
      organizationId: "org-1",
      roleTitle: "Senior Product Manager",
      status: FUNNEL_UPDATE_STATUSES[0], // "pending"
      urgency: URGENCY_LEVELS[2], // "high"
    },
    {
      candidateName: "John Doe",
      deadline: addDays(now, 1).toISOString(),
      id: "funnel-2",
      message: "Interview feedback pending from technical panel.",
      organizationId: "org-1",
      roleTitle: "Lead Software Engineer",
      status: FUNNEL_UPDATE_STATUSES[0], // "pending"
      urgency: URGENCY_LEVELS[1], // "medium"
    },
    {
      candidateName: "Emily Chen",
      deadline: endOfDay.toISOString(),
      id: "funnel-3",
      message:
        "Final round interview scheduled. Candidate requires immediate response.",
      organizationId: "org-1",
      roleTitle: "UX Designer",
      status: FUNNEL_UPDATE_STATUSES[0], // "pending"
      urgency: URGENCY_LEVELS[3], // "critical"
    },
    {
      candidateName: "Michael Rodriguez",
      deadline: addDays(now, 3).toISOString(),
      id: "funnel-4",
      message: "Background check in progress. Expected completion in 2-3 days.",
      organizationId: "org-1",
      roleTitle: "Data Scientist",
      status: FUNNEL_UPDATE_STATUSES[0], // "pending"
      urgency: URGENCY_LEVELS[0], // "low"
    },
  ];
}

/**
 * Creates mock daily agenda items
 */
export function createMockDailyAgenda(date: Date = new Date()): AgendaItem[] {
  const morning = new Date(date);
  morning.setHours(9, 0, 0, 0);

  const lateMorning = new Date(date);
  lateMorning.setHours(10, 30, 0, 0);

  const afternoon = new Date(date);
  afternoon.setHours(14, 0, 0, 0);

  const lateAfternoon = new Date(date);
  lateAfternoon.setHours(15, 30, 0, 0);

  const earlyEvening = new Date(date);
  earlyEvening.setHours(16, 0, 0, 0);

  const evening = new Date(date);
  evening.setHours(17, 0, 0, 0);

  return [
    {
      id: "agenda-1",
      relatedEntityId: "job-1",
      relatedEntityType: "job",
      scheduledTime: morning.toISOString(),
      status: AGENDA_ITEM_STATUSES[0], // "pending"
      title: "Review AI Candidate Profiles for Senior Software Engineer Role",
    },
    {
      id: "agenda-2",
      relatedEntityId: "candidate-1",
      relatedEntityType: "candidate",
      scheduledTime: afternoon.toISOString(),
      status: AGENDA_ITEM_STATUSES[0], // "pending"
      title: "Schedule interview with candidate 'Alex Johnson'",
    },
    {
      id: "agenda-3",
      relatedEntityId: "candidate-2",
      relatedEntityType: "candidate",
      scheduledTime: lateMorning.toISOString(),
      status: AGENDA_ITEM_STATUSES[0], // "pending"
      title: "Follow up on offer response from candidate 'Sarah Chen'",
    },
    {
      id: "agenda-4",
      relatedEntityId: "job-2",
      relatedEntityType: "job",
      scheduledTime: lateAfternoon.toISOString(),
      status: AGENDA_ITEM_STATUSES[0], // "pending"
      title: "Update job posting for UX Designer position",
    },
    {
      id: "agenda-5",
      relatedEntityId: "candidate-3",
      relatedEntityType: "candidate",
      scheduledTime: earlyEvening.toISOString(),
      status: AGENDA_ITEM_STATUSES[0], // "pending"
      title: "Review background check results for 'Michael Rodriguez'",
    },
    {
      id: "agenda-6",
      relatedEntityId: "job-3",
      relatedEntityType: "job",
      scheduledTime: evening.toISOString(),
      status: AGENDA_ITEM_STATUSES[0], // "pending"
      title: "Prepare interview questions for Data Scientist role",
    },
  ];
}

/**
 * Creates mock calendar events with random times between 8am and 6pm
 */
export function createMockCalendarEvents(
  date: Date = new Date(),
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const eventTemplates = [
    {
      relatedEntityId: "candidate-1",
      relatedEntityType: CALENDAR_RELATED_ENTITY_TYPES[0], // "candidate"
      title: "AI Candidate Screening",
      type: CALENDAR_EVENT_TYPES[2], // "screening"
    },
    {
      participants: ["user-1", "user-2"],
      title: "Team Sync: Q4 Agentic Features",
      type: CALENDAR_EVENT_TYPES[3], // "sync"
    },
  ];

  // Generate 2 events at random times between 8am (8) and 6pm (18)
  const startHour = 8;
  const endHour = 18;
  const usedTimes: number[] = [];

  // Valid durations in minutes: 15, 30, 45, or 60 (1 hour)
  const validDurations = [15, 30, 45, 60];

  for (let i = 0; i < 2; i++) {
    const template = eventTemplates[i];
    if (!template) break;

    // Generate random start time (in minutes from 8am)
    // Range: 0 to (endHour - startHour) * 60 minutes
    const maxMinutes = (endHour - startHour) * 60;
    let startMinutes: number;

    // Ensure events don't overlap by keeping at least 30 minutes between them
    do {
      startMinutes = Math.floor(Math.random() * maxMinutes);
      // Round to nearest 15-minute increment (0, 15, 30, 45)
      startMinutes = Math.round(startMinutes / 15) * 15;
    } while (usedTimes.some((used) => Math.abs(startMinutes - used) < 30));

    usedTimes.push(startMinutes);

    // Event duration: randomly choose from 15, 30, 45, or 60 minutes
    const durationIndex = Math.floor(Math.random() * validDurations.length);
    const durationMinutes = validDurations[durationIndex] ?? 30;

    // Calculate start and end times
    const startTime = new Date(date);
    const startHourValue = startHour + Math.floor(startMinutes / 60);
    const startMinuteValue = startMinutes % 60;
    startTime.setHours(startHourValue, startMinuteValue, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    // Make sure end time doesn't exceed 6pm
    if (endTime.getHours() >= endHour) {
      endTime.setHours(endHour, 0, 0, 0);
    }

    events.push({
      endTime: endTime.toISOString(),
      id: `event-${i + 1}`,
      startTime: startTime.toISOString(),
      title: template.title,
      type: template.type,
      ...(template.relatedEntityId && {
        relatedEntityId: template.relatedEntityId,
        relatedEntityType: template.relatedEntityType,
      }),
      ...(template.participants && { participants: template.participants }),
    });
  }

  // Sort events by start time
  return events.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

/**
 * Creates mock performance metrics
 */
export function createMockPerformanceMetrics(): PerformanceMetric[] {
  return [
    {
      id: "metric-1",
      label: "Placements This Month",
      period: PERFORMANCE_METRIC_PERIODS[2], // "monthly"
      target: 15,
      unit: "placements",
      value: 12,
    },
    {
      id: "metric-2",
      label: "Interviews Scheduled",
      period: PERFORMANCE_METRIC_PERIODS[2], // "monthly"
      target: 50,
      unit: "interviews",
      value: 45,
    },
    {
      id: "metric-3",
      label: "Active Candidates",
      period: PERFORMANCE_METRIC_PERIODS[2], // "monthly"
      target: 100,
      unit: "candidates",
      value: 120,
    },
  ];
}

/**
 * Creates mock growth trends data
 */
export function createMockGrowthTrends(): GrowthTrend[] {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Generate 12 months ending with the current month
  const dataPoints: GrowthTrendDataPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthAbbr = format(monthDate, "MMM"); // e.g., "Jan", "Feb"
    const monthYear = monthDate.getFullYear();

    // Add year suffix for months from previous year
    const period =
      monthYear < currentYear
        ? `${monthAbbr} '${String(monthYear).slice(-2)}'`
        : monthAbbr;

    const label =
      monthYear < currentYear
        ? `${monthAbbr} '${String(monthYear).slice(-2)}'`
        : monthAbbr;

    dataPoints.push({
      label,
      period,
      value: 20 + (11 - i) * 3 + Math.random() * 5,
    });
  }

  return [
    {
      comparison: {
        changePercentage: 12.5,
        previousPeriod: 35,
      },
      dataPoints,
      id: "trend-1",
      metric: "Monthly Placements",
    },
  ];
}

/**
 * Creates mock chat messages
 */
export function createMockChatMessages(): ChatMessage[] {
  const now = new Date();
  const earlier = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

  return [
    {
      content: "Hello! I'm your AI Assistant. How can I help you today?",
      id: "msg-1",
      role: CHAT_MESSAGE_ROLES[1], // "assistant"
      timestamp: earlier.toISOString(),
    },
    {
      content: "Show me candidates for the Senior Software Engineer role.",
      id: "msg-2",
      metadata: {
        relatedEntityId: "job-1",
        relatedEntityType: "job",
      },
      role: CHAT_MESSAGE_ROLES[0], // "user"
      timestamp: new Date(earlier.getTime() + 1 * 60 * 1000).toISOString(),
    },
    {
      content:
        "I've filtered the pipeline for Senior Software Engineer candidates. Alice Johnson is currently in the 'Applied' stage. Would you like me to summarize her profile?",
      id: "msg-3",
      metadata: {
        relatedEntityId: "candidate-1",
        relatedEntityType: "candidate",
      },
      role: CHAT_MESSAGE_ROLES[1], // "assistant"
      timestamp: new Date(earlier.getTime() + 2 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Creates mock contextual actions
 */
export function createMockContextualActions(): ContextualAction[] {
  return [
    {
      action: "schedule-interview",
      icon: "CalendarIcon",
      id: "action-1",
      label: "Schedule Interview",
      requiresContext: true,
    },
    {
      action: "summarize-candidate",
      icon: "CheckIcon",
      id: "action-2",
      label: "Summarize Candidate",
      requiresContext: true,
    },
    {
      action: "send-to-marketplace",
      icon: "BellIcon",
      id: "action-3",
      label: "Send To Marketplace",
      requiresContext: false,
    },
    {
      action: "move-to-next-stage",
      icon: "TrendingUpIcon",
      id: "action-4",
      label: "Move to Next Stage",
      requiresContext: true,
    },
  ];
}

/**
 * Creates complete mock data for the Jobs and Clients page
 *
 * @param calendarDate - Date to use for calendar events. Daily agenda always uses today's date.
 */
export function createMockJobsAndClientsData(calendarDate: Date = new Date()) {
  const today = new Date();

  return {
    calendarEvents: createMockCalendarEvents(calendarDate),
    chatMessages: createMockChatMessages(),
    contextualActions: createMockContextualActions(),
    dailyAgenda: createMockDailyAgenda(today),
    growthTrends: createMockGrowthTrends(),
    performanceMetrics: createMockPerformanceMetrics(),
    urgentFunnelUpdates: createMockUrgentFunnelUpdates(),
  };
}
