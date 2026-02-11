# Jobs and Clients Feature - Implementation Guide

This document outlines the detailed implementation plan for the Jobs and Clients page, focusing on database structure, data flow, and how the feature would work with real data in a production environment.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema Design](#database-schema-design)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Feature Implementation Details](#feature-implementation-details)
5. [API and Server Functions](#api-and-server-functions)
6. [Performance Considerations](#performance-considerations)
7. [Security and Access Control](#security-and-access-control)

## Overview

The Jobs and Clients page is a comprehensive dashboard for managing recruitment workflows, including:

- **Urgent Funnel Updates**: Real-time notifications about pending offers, interviews, and candidate actions
- **Daily Agenda**: Task management for recruitment activities
- **Calendar Events**: Scheduling and managing interviews, meetings, and screenings
- **Performance Metrics**: Analytics on placements, interviews, and candidate activity
- **Growth Trends**: Historical data visualization for recruitment metrics
- **AI Assistant**: Contextual chat interface for recruitment assistance

The page is organization-scoped, meaning all data is filtered by the current organization context.

## Database Schema Design

### Core Models

#### Job Model

```prisma
model Job {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Organization relationship
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // Job details
  title             String
  description       String?  @db.Text
  status            JobStatus @default(open)
  location          String?
  employmentType    EmploymentType @default(full_time)
  salaryRangeMin    Int?
  salaryRangeMax    Int?
  
  // Metadata
  postedAt          DateTime?
  closedAt          DateTime?
  targetStartDate   DateTime?
  
  // Relationships
  candidates        Candidate[]
  interviews        Interview[]
  calendarEvents    CalendarEvent[]
  agendaItems       AgendaItem[]
  funnelUpdates     FunnelUpdate[]
  
  @@index([organizationId, status])
  @@index([organizationId, postedAt])
}
```

#### Candidate Model

```prisma
model Candidate {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Organization relationship
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // Personal information
  firstName         String
  lastName          String
  email             String
  phone             String?
  linkedInUrl       String?
  resumeUrl         String?
  
  // Current status
  currentStage      CandidateStage @default(applied)
  currentJobId      String?
  currentJob        Job?           @relation(fields: [currentJobId], references: [id], onDelete: SetNull)
  
  // AI-generated data
  aiProfileSummary  String?  @db.Text
  aiMatchScore      Float?
  aiNotes           Json?    // Structured AI insights
  
  // Relationships
  applications      JobApplication[]
  interviews        Interview[]
  calendarEvents    CalendarEvent[]
  agendaItems       AgendaItem[]
  funnelUpdates     FunnelUpdate[]
  
  @@index([organizationId, currentStage])
  @@index([organizationId, currentJobId])
  @@index([email])
}
```

#### JobApplication Model (Join Table)

```prisma
model JobApplication {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  job               Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  jobId             String
  candidate         Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  candidateId       String
  
  // Application status
  stage             ApplicationStage @default(applied)
  appliedAt         DateTime @default(now())
  rejectedAt        DateTime?
  offerSentAt       DateTime?
  offerAcceptedAt   DateTime?
  offerRejectedAt   DateTime?
  
  // Notes and metadata
  notes             String?  @db.Text
  source            String?  // "ai-screening", "referral", "direct", etc.
  
  @@unique([jobId, candidateId])
  @@index([jobId, stage])
  @@index([candidateId])
}
```

#### Interview Model

```prisma
model Interview {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relationships
  job               Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  jobId             String
  candidate         Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  candidateId       String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // Interview details
  type              InterviewType @default(phone_screen)
  scheduledAt       DateTime
  durationMinutes   Int      @default(30)
  location          String?  // "Zoom", "Office", "Phone", etc.
  meetingUrl        String?
  
  // Status
  status            InterviewStatus @default(scheduled)
  completedAt       DateTime?
  cancelledAt      DateTime?
  cancellationReason String?  @db.Text
  
  // Feedback
  interviewerNotes  String?  @db.Text
  candidateFeedback String?  @db.Text
  rating            Int?     // 1-5 scale
  
  // Relationships
  calendarEvent     CalendarEvent?
  participants      InterviewParticipant[]
  
  @@index([organizationId, scheduledAt])
  @@index([jobId, candidateId])
  @@index([status, scheduledAt])
}
```

#### InterviewParticipant Model

```prisma
model InterviewParticipant {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  
  interview         Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  interviewId       String
  user              UserAccount @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId            String
  
  role              InterviewParticipantRole @default(interviewer)
  confirmedAt       DateTime?
  attendedAt        DateTime?
  
  @@unique([interviewId, userId])
  @@index([userId, interviewId])
}
```

#### CalendarEvent Model

```prisma
model CalendarEvent {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Organization relationship
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // Event details
  title             String
  description       String?  @db.Text
  type              CalendarEventType @default(meeting)
  startTime         DateTime
  endTime           DateTime
  
  // Optional relationships
  job               Job?      @relation(fields: [jobId], references: [id], onDelete: SetNull)
  jobId             String?
  candidate         Candidate? @relation(fields: [candidateId], references: [id], onDelete: SetNull)
  candidateId       String?
  interview         Interview? @relation(fields: [interviewId], references: [id], onDelete: SetNull)
  interviewId      String?
  
  // Participants (for non-interview events)
  participants      CalendarEventParticipant[]
  
  // Recurrence (optional)
  isRecurring       Boolean   @default(false)
  recurrenceRule    String?   // iCal RRULE format
  
  @@index([organizationId, startTime])
  @@index([organizationId, endTime])
  @@index([jobId])
  @@index([candidateId])
}
```

#### CalendarEventParticipant Model

```prisma
model CalendarEventParticipant {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  
  event             CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId           String
  user              UserAccount @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId            String
  
  status            ParticipantStatus @default(accepted) // accepted, declined, tentative
  
  @@unique([eventId, userId])
  @@index([userId, eventId])
}
```

#### AgendaItem Model

```prisma
model AgendaItem {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Organization relationship
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // Item details
  title             String
  description       String?  @db.Text
  scheduledTime     DateTime
  status            AgendaItemStatus @default(pending)
  priority          AgendaItemPriority @default(medium)
  
  // Optional relationships
  job               Job?      @relation(fields: [jobId], references: [id], onDelete: SetNull)
  jobId             String?
  candidate         Candidate? @relation(fields: [candidateId], references: [id], onDelete: SetNull)
  candidateId       String?
  interview         Interview? @relation(fields: [interviewId], references: [id], onDelete: SetNull)
  interviewId      String?
  
  // Assignment
  assignedTo        UserAccount? @relation(fields: [assignedToId], references: [id], onDelete: SetNull)
  assignedToId      String?
  createdBy         UserAccount @relation(fields: [createdById], references: [id], onDelete: Cascade)
  createdById       String
  
  @@index([organizationId, scheduledTime])
  @@index([organizationId, status, scheduledTime])
  @@index([assignedToId, scheduledTime])
}
```

#### FunnelUpdate Model

```prisma
model FunnelUpdate {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Organization relationship
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // Related entities
  job               Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  jobId             String
  candidate         Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  candidateId       String
  application       JobApplication? @relation(fields: [applicationId], references: [id], onDelete: SetNull)
  applicationId     String?
  
  // Update details
  type              FunnelUpdateType // offer_pending, interview_feedback, background_check, etc.
  status            FunnelUpdateStatus @default(pending)
  urgency           UrgencyLevel @default(medium)
  message           String   @db.Text
  deadline          DateTime
  
  // Reminder tracking
  reminderSentAt    DateTime?
  reminderCount     Int      @default(0)
  
  // Resolution
  resolvedAt        DateTime?
  resolvedBy        UserAccount? @relation(fields: [resolvedById], references: [id], onDelete: SetNull)
  resolvedById      String?
  
  @@index([organizationId, status, deadline])
  @@index([organizationId, urgency, deadline])
  @@index([deadline])
}
```

#### PerformanceMetric Model

```prisma
model PerformanceMetric {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Organization relationship
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // Metric details
  label             String   // "Job Placements", "Interviews Scheduled", etc.
  value             Float
  target            Float
  unit              String   // "placements", "interviews", "candidates"
  period            PerformanceMetricPeriod @default(monthly)
  periodStart       DateTime
  periodEnd         DateTime
  
  // Metadata
  lastUpdatedAt     DateTime @default(now()) // When this metric was last updated
  source            String   @default("auto_calculated") // "manual", "auto_calculated"
  
  @@unique([organizationId, label, periodStart, period])
  @@index([organizationId, periodStart, period])
  @@index([organizationId, period, periodStart])
}
```

#### GrowthTrend Model

```prisma
model GrowthTrend {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Organization relationship
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // Trend details
  metric            String   // "Number of Roles Interviewed For", "Number of Interviews", etc.
  period            DateTime // The month/year this trend data point represents
  value             Float    // The value for this period
  
  // Comparison data (for current period)
  previousPeriodValue Float? // Value from previous period (for calculating change %)
  changePercentage    Float? // Calculated change percentage
  
  // Metadata
  lastUpdatedAt     DateTime @default(now()) // When this trend was last updated
  
  @@unique([organizationId, metric, period])
  @@index([organizationId, metric, period])
  @@index([organizationId, period])
}
```

#### ChatMessage Model (AI Assistant)

```prisma
model ChatMessage {
  id                String   @id @default(cuid(2))
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Organization relationship
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId    String
  
  // User relationship
  user              UserAccount @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId            String
  
  // Message details
  role              ChatMessageRole @default(user)
  content           String   @db.Text
  
  // Contextual metadata
  metadata          Json?    // { relatedEntityId, relatedEntityType, actionTaken, etc. }
  
  // Threading (optional)
  threadId          String?  // For grouping related messages
  parentMessageId   String?
  parentMessage     ChatMessage? @relation("MessageThread", fields: [parentMessageId], references: [id], onDelete: SetNull)
  replies           ChatMessage[] @relation("MessageThread")
  
  @@index([organizationId, userId, createdAt])
  @@index([threadId])
}
```

### Enums

```prisma
enum JobStatus {
  draft
  open
  paused
  closed
  filled
}

enum EmploymentType {
  full_time
  part_time
  contract
  internship
  temporary
}

enum CandidateStage {
  applied
  screening
  interview
  offer
  hired
  rejected
  withdrawn
}

enum ApplicationStage {
  applied
  screening
  phone_screen
  technical_interview
  final_interview
  offer_pending
  offer_sent
  offer_accepted
  offer_rejected
  rejected
  withdrawn
}

enum InterviewType {
  phone_screen
  technical
  behavioral
  final
  panel
  ai_screening
}

enum InterviewStatus {
  scheduled
  confirmed
  in_progress
  completed
  cancelled
  no_show
}

enum InterviewParticipantRole {
  interviewer
  observer
  coordinator
}

enum CalendarEventType {
  interview
  meeting
  screening
  sync
  other
}

enum ParticipantStatus {
  accepted
  declined
  tentative
  pending
}

enum AgendaItemStatus {
  pending
  completed
  cancelled
  deferred
}

enum AgendaItemPriority {
  low
  medium
  high
  critical
}

enum FunnelUpdateType {
  offer_pending
  interview_feedback
  background_check
  reference_check
  document_review
  other
}

enum FunnelUpdateStatus {
  pending
  in_progress
  resolved
  expired
  cancelled
}

enum UrgencyLevel {
  low
  medium
  high
  critical
}

enum PerformanceMetricPeriod {
  daily
  weekly
  monthly
  quarterly
  yearly
}

enum ChatMessageRole {
  user
  assistant
  system
}
```

### Updated Organization Model

Add the following relations to the existing `Organization` model:

```prisma
model Organization {
  // ... existing fields ...
  
  // Jobs and Clients relationships
  jobs              Job[]
  candidates        Candidate[]
  interviews        Interview[]
  calendarEvents    CalendarEvent[]
  agendaItems       AgendaItem[]
  funnelUpdates     FunnelUpdate[]
  performanceMetrics PerformanceMetric[]
  growthTrends      GrowthTrend[]
  chatMessages      ChatMessage[]
}
```

## Data Flow Architecture

### 1. Page Load Flow

```
User Request → Route Loader → Database Queries → Data Transformation → UI Rendering
```

#### Loader Function Structure

```typescript
// app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/jobs-and-clients.tsx

export async function loader({ params, context, request }: Route.LoaderArgs) {
  // 1. Authentication & Authorization
  const user = await requireUser(context);
  const organization = await requireOrganizationMembership(
    user.id,
    params.organizationSlug,
  );

  // 2. Parse query parameters
  const calendarDate = parseDateParam(request, "calendar_date");
  const metricsMonth = parseDateParam(request, "metrics_month");

  // 3. Parallel data fetching
  const [
    urgentFunnelUpdates,
    dailyAgenda,
    calendarEvents,
    performanceMetrics,
    growthTrends,
    chatMessages,
  ] = await Promise.all([
    getUrgentFunnelUpdates(organization.id),
    getDailyAgenda(organization.id, new Date()),
    getCalendarEvents(organization.id, calendarDate),
    getPerformanceMetrics(organization.id, metricsMonth),
    getGrowthTrends(organization.id),
    getChatMessages(organization.id, user.id),
  ]);

  // 4. Return structured data
  return data({
    urgentFunnelUpdates,
    dailyAgenda,
    calendarEvents,
    performanceMetrics,
    growthTrends,
    chatMessages,
    contextualActions: getContextualActions(),
    calendarDate: calendarDate.toISOString(),
    metricsMonth: metricsMonth.toISOString(),
  });
}
```

### 2. Database Query Functions

#### Urgent Funnel Updates

```typescript
// app/features/jobs-and-clients/jobs-and-clients-model.server.ts

export async function getUrgentFunnelUpdates(
  organizationId: string,
): Promise<UrgentFunnelUpdate[]> {
  const db = getDatabase();
  
  const updates = await db.funnelUpdate.findMany({
    where: {
      organizationId,
      status: { in: ["pending", "in_progress"] },
      deadline: { gte: new Date() }, // Only future deadlines
    },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      { urgency: "desc" }, // Critical first
      { deadline: "asc" },  // Soonest deadline first
    ],
    take: 10, // Limit to top 10 most urgent
  });

  return updates.map((update) => ({
    id: update.id,
    candidateName: `${update.candidate.firstName} ${update.candidate.lastName}`,
    roleTitle: update.job.title,
    status: update.status,
    urgency: update.urgency,
    deadline: update.deadline.toISOString(),
    message: update.message,
    organizationId: update.organizationId,
    reminderSentAt: update.reminderSentAt?.toISOString() ?? null,
  }));
}
```

#### Daily Agenda

```typescript
export async function getDailyAgenda(
  organizationId: string,
  date: Date,
): Promise<AgendaItem[]> {
  const db = getDatabase();
  
  const startOfDay = startOf(date);
  const endOfDay = endOf(date);

  const items = await db.agendaItem.findMany({
    where: {
      organizationId,
      scheduledTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { not: "cancelled" },
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
        },
      },
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { status: "asc" }, // Pending first
      { scheduledTime: "asc" }, // Earliest first
    ],
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    scheduledTime: item.scheduledTime.toISOString(),
    status: item.status,
    description: item.description ?? undefined,
    relatedEntityId: item.jobId ?? item.candidateId ?? item.interviewId ?? undefined,
    relatedEntityType: item.jobId
      ? "job"
      : item.candidateId
        ? "candidate"
        : item.interviewId
          ? "interview"
          : undefined,
  }));
}
```

#### Calendar Events

```typescript
export async function getCalendarEvents(
  organizationId: string,
  date: Date,
): Promise<CalendarEvent[]> {
  const db = getDatabase();
  
  const startOfDay = startOf(date);
  const endOfDay = endOf(date);

  const events = await db.calendarEvent.findMany({
    where: {
      organizationId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
        },
      },
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    description: event.description ?? undefined,
    type: event.type,
    participants: event.participants.map((p) => p.user.id),
    relatedEntityId: event.jobId ?? event.candidateId ?? undefined,
    relatedEntityType: event.jobId ? "job" : event.candidateId ? "candidate" : undefined,
  }));
}
```

#### Performance Metrics

**Note**: Performance metrics are updated in real-time whenever relevant events occur (e.g., job placement, interview scheduled). The loader simply reads the pre-calculated values from the database.

```typescript
export async function getPerformanceMetrics(
  organizationId: string,
  month: Date,
): Promise<PerformanceMetric[]> {
  const db = getDatabase();
  
  const periodStart = startOfMonth(month);
  const periodEnd = endOfMonth(month);

  // Simply read the pre-calculated metrics from the database
  // These are kept up-to-date via real-time updates (see Real-time Metric Updates section)
  const metrics = await db.performanceMetric.findMany({
    where: {
      organizationId,
      period: "monthly",
      periodStart: periodStart,
      periodEnd: periodEnd,
    },
  });

  // If metrics don't exist yet (e.g., new month), initialize them
  if (metrics.length === 0) {
    const targets = await getOrganizationTargets(organizationId);
    
    const initialMetrics = [
      {
        organizationId,
        label: "Job Placements",
        value: 0,
        target: targets.placements,
        unit: "placements",
        period: "monthly" as const,
        periodStart,
        periodEnd,
        lastUpdatedAt: new Date(),
        source: "auto_calculated",
      },
      {
        organizationId,
        label: "Interviews Scheduled",
        value: 0,
        target: targets.interviews,
        unit: "interviews",
        period: "monthly" as const,
        periodStart,
        periodEnd,
        lastUpdatedAt: new Date(),
        source: "auto_calculated",
      },
      {
        organizationId,
        label: "Active Candidates",
        value: 0,
        target: targets.candidates,
        unit: "candidates",
        period: "monthly" as const,
        periodStart,
        periodEnd,
        lastUpdatedAt: new Date(),
        source: "auto_calculated",
      },
    ];

    await db.performanceMetric.createMany({
      data: initialMetrics,
    });

    return initialMetrics.map((m) => ({
      id: m.id || "",
      label: m.label,
      value: m.value,
      target: m.target,
      unit: m.unit,
      period: m.period,
    }));
  }

  return metrics.map((m) => ({
    id: m.id,
    label: m.label,
    value: m.value,
    target: m.target,
    unit: m.unit,
    period: m.period,
  }));
}
```

#### Growth Trends

**Note**: Growth trends are updated in real-time whenever relevant events occur (e.g., interview scheduled, role created). The loader simply reads the pre-calculated values from the database.

```typescript
export async function getGrowthTrends(
  organizationId: string,
): Promise<GrowthTrend[]> {
  const db = getDatabase();
  
  const now = new Date();
  const twelveMonthsAgo = subMonths(now, 12);

  // Get all growth trend data points for the past 12 months
  const rolesTrends = await db.growthTrend.findMany({
    where: {
      organizationId,
      metric: "Number of Roles Interviewed For",
      period: {
        gte: twelveMonthsAgo,
        lte: now,
      },
    },
    orderBy: {
      period: "asc",
    },
  });

  const interviewsTrends = await db.growthTrend.findMany({
    where: {
      organizationId,
      metric: "Number of Interviews",
      period: {
        gte: twelveMonthsAgo,
        lte: now,
      },
    },
    orderBy: {
      period: "asc",
    },
  });

  // Transform to GrowthTrend format
  const rolesDataPoints = rolesTrends.map((trend) => ({
    period: format(trend.period, "MMM"),
    label: format(trend.period, "MMM"),
    value: trend.value,
  }));

  const interviewsDataPoints = interviewsTrends.map((trend) => ({
    period: format(trend.period, "MMM"),
    label: format(trend.period, "MMM"),
    value: trend.value,
  }));

  // Get comparison data from the most recent trend entry
  const currentRolesTrend = rolesTrends[rolesTrends.length - 1];
  const currentInterviewsTrend = interviewsTrends[interviewsTrends.length - 1];

  return [
    {
      id: "trend-roles",
      metric: "Number of Roles Interviewed For",
      dataPoints: rolesDataPoints,
      comparison: currentRolesTrend
        ? {
            previousPeriod: currentRolesTrend.previousPeriodValue ?? 0,
            changePercentage: currentRolesTrend.changePercentage ?? 0,
          }
        : undefined,
    },
    {
      id: "trend-interviews",
      metric: "Number of Interviews",
      dataPoints: interviewsDataPoints,
      comparison: currentInterviewsTrend
        ? {
            previousPeriod: currentInterviewsTrend.previousPeriodValue ?? 0,
            changePercentage: currentInterviewsTrend.changePercentage ?? 0,
          }
        : undefined,
    },
  ];
}
```

### 3. Action Handlers

#### Send Reminder Action

```typescript
// app/features/jobs-and-clients/jobs-and-clients-action.server.ts

export async function jobsAndClientsAction(args: Route.ActionArgs) {
  const result = await validateFormData(
    args.request,
    jobsAndClientsActionSchema,
  );

  if (!result.success) {
    return result.response;
  }

  const user = await requireUser(args.context);
  const organization = await requireOrganizationMembership(
    user.id,
    args.params.organizationSlug,
  );

  const body = result.data;

  switch (body.intent) {
    case jobsAndClientsIntents.sendReminder: {
      const { updateId } = body;

      // Update the funnel update
      const update = await db.funnelUpdate.update({
        where: {
          id: updateId,
          organizationId: organization.id, // Ensure organization match
        },
        data: {
          reminderSentAt: new Date(),
          reminderCount: { increment: 1 },
        },
        include: {
          candidate: true,
          job: true,
        },
      });

      // Send actual reminder (email, notification, etc.)
      await sendFunnelUpdateReminder(update, user);

      // Return updated data
      const updatedUpdates = await getUrgentFunnelUpdates(organization.id);
      return data({ urgentFunnelUpdates: updatedUpdates });
    }

    case jobsAndClientsIntents.toggleAgendaItem: {
      const { itemId, newStatus } = body;

      // Update agenda item
      await db.agendaItem.update({
        where: {
          id: itemId,
          organizationId: organization.id,
        },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      // Return updated agenda
      const updatedAgenda = await getDailyAgenda(organization.id, new Date());
      return data({ dailyAgenda: updatedAgenda });
    }

    case jobsAndClientsIntents.addOrEditEvent: {
      const {
        eventId,
        title,
        type,
        startTime,
        endTime,
        description,
        participants,
      } = body;

      if (eventId) {
        // Update existing event
        await db.calendarEvent.update({
          where: {
            id: eventId,
            organizationId: organization.id,
          },
          data: {
            title,
            type,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            description: description || null,
          },
        });

        // Update participants
        if (participants) {
          const participantIds = participants.split(",").map((p) => p.trim());
          
          // Delete existing participants
          await db.calendarEventParticipant.deleteMany({
            where: { eventId },
          });

          // Create new participants
          await db.calendarEventParticipant.createMany({
            data: participantIds.map((userId) => ({
              eventId,
              userId,
              status: "accepted",
            })),
          });
        }
      } else {
        // Create new event
        const newEvent = await db.calendarEvent.create({
          data: {
            organizationId: organization.id,
            title,
            type,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            description: description || null,
            participants: participants
              ? {
                  create: participants.split(",").map((userId) => ({
                    userId: userId.trim(),
                    status: "accepted",
                  })),
                }
              : undefined,
          },
        });
      }

      // Return updated events
      const calendarDate = parseDateParam(args.request, "calendar_date");
      const updatedEvents = await getCalendarEvents(organization.id, calendarDate);
      return data({ calendarEvents: updatedEvents });
    }
  }
}
```

## Feature Implementation Details

### Urgent Funnel Updates

**Purpose**: Display time-sensitive actions required for candidates in the recruitment pipeline.

**Data Sources**:
- `FunnelUpdate` table filtered by `status = 'pending'` and `deadline >= now()`
- Sorted by urgency (critical → high → medium → low) and deadline (soonest first)

**Real-time Updates**:
- Background job checks for new funnel updates every 5 minutes
- WebSocket or Server-Sent Events (SSE) for instant updates when updates are created
- Reminder system sends notifications when deadline approaches

**Reminder Logic**:
- When user clicks "Send Reminder", update `reminderSentAt` and increment `reminderCount`
- Send email/SMS to relevant stakeholders
- Prevent duplicate reminders within 30 minutes

### Daily Agenda

**Purpose**: Task management for recruitment activities scheduled for the current day.

**Data Sources**:
- `AgendaItem` table filtered by `scheduledTime` (start/end of day) and `status != 'cancelled'`
- Can be manually created or auto-generated from:
  - Upcoming interviews
  - Pending funnel updates
  - Job posting deadlines
  - Candidate follow-ups

**Auto-generation Rules**:
- Create agenda item when interview is scheduled
- Create agenda item when funnel update deadline is within 24 hours
- Create agenda item when job posting is about to expire

**Status Management**:
- Toggle between `pending` and `completed`
- Completed items remain visible but sorted to bottom
- Can be deferred to another date

### Calendar Events

**Purpose**: Visualize and manage scheduled interviews, meetings, and other events.

**Data Sources**:
- `CalendarEvent` table filtered by `startTime` (within selected date)
- Includes both interview-linked events and standalone meetings

**Event Types**:
- **Interview**: Linked to `Interview` record, includes candidate and job
- **Meeting**: Team sync, planning, etc.
- **Screening**: AI or initial candidate screening
- **Sync**: Regular team meetings
- **Other**: Miscellaneous events

**CRUD Operations**:
- Create: Form with title, type, time, participants, optional job/candidate link
- Read: Display events in calendar view, grouped by hour
- Update: Edit event details, reschedule
- Delete: Soft delete (mark as cancelled) or hard delete

### Performance Metrics

**Purpose**: Track KPIs for recruitment performance.

**Real-time Update Strategy**:
- Metrics are **updated in real-time** whenever relevant events occur in the system
- When a job placement happens, interview is scheduled, or candidate applies, the corresponding metric for the current month is immediately updated
- The loader simply reads pre-calculated values from the `PerformanceMetric` table
- This ensures charts always display up-to-date data without expensive calculations on every page load

**Metric Types**:
- **Job Placements**: Incremented when `JobApplication.stage` changes to `offer_accepted`
- **Interviews Scheduled**: Incremented when `Interview` is created with `status = 'scheduled'`
- **Active Candidates**: Incremented when a new `JobApplication` is created

**Targets**:
- Stored in organization settings or separate `OrganizationTarget` table
- Can be set per month/quarter
- Defaults provided if not set

### Growth Trends

**Purpose**: Historical visualization of recruitment metrics over time.

**Real-time Update Strategy**:
- Growth trends are **updated in real-time** whenever relevant events occur
- When an interview is scheduled or a role is created, the corresponding trend data point for that month is immediately updated
- The loader simply reads pre-calculated values from the `GrowthTrend` table
- This ensures charts always display up-to-date historical data without expensive aggregations on every page load

**Trend Types**:
- **Number of Roles Interviewed For**: Updated when an interview is scheduled for a job (counts distinct jobs)
- **Number of Interviews**: Updated when an interview is scheduled (counts all interviews)

**Comparison Calculation**:
- When updating the current month's trend, the system automatically calculates the change percentage compared to the previous month
- This comparison data is stored in the `GrowthTrend` record for efficient retrieval

### AI Assistant

**Purpose**: Contextual chat interface for recruitment assistance.

**Data Sources**:
- `ChatMessage` table filtered by `organizationId` and `userId`
- Maintains conversation thread via `threadId`

**Integration Points**:
- Can reference jobs, candidates, interviews via `metadata.relatedEntityId`
- Actions can trigger updates to related entities
- Context-aware responses based on current page state

**Message Flow**:
1. User sends message → Save to database
2. Send to AI service (OpenAI, Anthropic, etc.) with context
3. Receive response → Save to database
4. Display in UI

**AI-Assisted Creation**:
- Users can ask the AI assistant to create funnel updates or agenda items
- Example: "Create a reminder to follow up with Sarah Miller about her offer by end of day"
- The AI parses the request, extracts entities (candidate, job, deadline), and creates the appropriate record
- Can also suggest agenda items based on context: "You have 3 interviews tomorrow, would you like me to create agenda items for them?"

## Auto-Generation of Funnel Updates and Agenda Items

In a real implementation, funnel updates and agenda items are created automatically through a combination of database triggers, application-level hooks, and user-initiated actions (including AI assistant requests).

### Funnel Updates Creation

Funnel updates are created when specific events occur in the recruitment pipeline that require action or follow-up.

#### Creation Triggers

1. **Job Application Stage Changes**
   - When `JobApplication.stage` changes to `offer_pending` → create `FunnelUpdate` with `type: "offer_pending"`
   - When `offer_sent` → create update with deadline for candidate response
   - When application enters `background_check` or `reference_check` stages → create updates for those types

2. **Interview Completion**
   - When `Interview.status` changes to `completed` → create `FunnelUpdate` with `type: "interview_feedback"` requiring interviewer notes

3. **Manual Creation via AI Assistant**
   - Users can ask: "Create a funnel update for John Doe's offer response, deadline tomorrow"
   - AI parses the request and creates the appropriate `FunnelUpdate` record

#### Database Trigger Example (PostgreSQL)

```sql
-- Trigger function to create funnel update when offer is sent
CREATE OR REPLACE FUNCTION create_funnel_update_on_offer_sent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'offer_sent' AND OLD.stage != 'offer_sent' THEN
    INSERT INTO "FunnelUpdate" (
      "organizationId",
      "jobId",
      "candidateId",
      "applicationId",
      "type",
      "status",
      "urgency",
      "message",
      "deadline",
      "createdAt",
      "updatedAt"
    )
    SELECT
      j."organizationId",
      NEW."jobId",
      NEW."candidateId",
      NEW.id,
      'offer_pending',
      'pending',
      CASE
        WHEN NEW."offerSentAt" + INTERVAL '3 days' <= NOW() + INTERVAL '1 day' THEN 'critical'
        WHEN NEW."offerSentAt" + INTERVAL '3 days' <= NOW() + INTERVAL '2 days' THEN 'high'
        ELSE 'medium'
      END,
      'Awaiting offer acceptance for ' || c."firstName" || ' ' || c."lastName" || ' - ' || j.title,
      NEW."offerSentAt" + INTERVAL '3 days', -- Default 3-day response deadline
      NOW(),
      NOW()
    FROM "Job" j
    JOIN "Candidate" c ON c.id = NEW."candidateId"
    WHERE j.id = NEW."jobId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_create_funnel_update_on_offer_sent
  AFTER UPDATE OF stage ON "JobApplication"
  FOR EACH ROW
  WHEN (NEW.stage = 'offer_sent' AND OLD.stage != 'offer_sent')
  EXECUTE FUNCTION create_funnel_update_on_offer_sent();
```

#### Application-Level Hook Example

```typescript
// app/features/jobs-and-clients/jobs-and-clients-hooks.server.ts

/**
 * Create funnel update when interview is completed
 */
export async function createFunnelUpdateOnInterviewCompleted(
  interviewId: string,
) {
  const db = getDatabase();
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
    include: {
      job: true,
      candidate: true,
    },
  });

  if (!interview || interview.status !== "completed") return;

  // Check if feedback is missing
  const hasFeedback = interview.interviewerNotes && interview.interviewerNotes.trim().length > 0;

  if (!hasFeedback) {
    // Create funnel update for missing feedback
    await db.funnelUpdate.create({
      data: {
        organizationId: interview.organizationId,
        jobId: interview.jobId,
        candidateId: interview.candidateId,
        type: "interview_feedback",
        status: "pending",
        urgency: calculateUrgency(interview.completedAt, 24), // 24-hour deadline
        message: `Interview feedback pending for ${interview.candidate.firstName} ${interview.candidate.lastName} - ${interview.job.title}`,
        deadline: addHours(interview.completedAt, 24),
      },
    });
  }
}

/**
 * Create funnel update when application stage changes
 */
export async function createFunnelUpdateOnApplicationStageChange(
  applicationId: string,
  oldStage: ApplicationStage,
  newStage: ApplicationStage,
) {
  const db = getDatabase();
  const application = await db.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      candidate: true,
    },
  });

  if (!application) return;

  // Map stage changes to funnel update types
  const stageToFunnelType: Record<string, FunnelUpdateType> = {
    offer_pending: "offer_pending",
    background_check: "background_check",
    reference_check: "reference_check",
  };

  const funnelType = stageToFunnelType[newStage];
  if (!funnelType) return;

  // Calculate deadline based on stage
  const deadline = calculateDeadlineForStage(newStage);
  const urgency = calculateUrgencyFromDeadline(deadline);

  await db.funnelUpdate.create({
    data: {
      organizationId: application.job.organizationId,
      jobId: application.jobId,
      candidateId: application.candidateId,
      applicationId: application.id,
      type: funnelType,
      status: "pending",
      urgency,
      message: generateFunnelUpdateMessage(funnelType, application),
      deadline,
    },
  });
}

// Hook into Prisma middleware
db.$use(async (params, next) => {
  const result = await next(params);

  if (params.model === "Interview" && params.action === "update") {
    if (params.args.data.status === "completed") {
      await createFunnelUpdateOnInterviewCompleted(result.id);
    }
  }

  if (params.model === "JobApplication" && params.action === "update") {
    const oldStage = result.stage;
    const newStage = params.args.data.stage;
    if (oldStage !== newStage) {
      await createFunnelUpdateOnApplicationStageChange(
        result.id,
        oldStage,
        newStage,
      );
    }
  }

  return result;
});
```

### Daily Agenda Items Creation

Agenda items are created automatically from various recruitment events and can also be manually created by users or the AI assistant.

#### Creation Triggers

1. **Interview Scheduled**
   - When an `Interview` is created with `status = 'scheduled'` → create `AgendaItem` for that interview

2. **Funnel Update Deadline Approaching**
   - When a `FunnelUpdate.deadline` is within 24 hours → create `AgendaItem` to remind user

3. **Job Posting Expiration**
   - When a `Job.postedAt` + expiration period approaches → create `AgendaItem` for job posting renewal

4. **Manual Creation via AI Assistant**
   - Users can ask: "Add 'Review candidate profiles for Senior Engineer role' to my agenda for tomorrow at 2pm"
   - AI creates the agenda item with the specified details

#### Database Trigger Example (PostgreSQL)

```sql
-- Trigger function to create agenda item when interview is scheduled
CREATE OR REPLACE FUNCTION create_agenda_item_on_interview_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' AND (OLD.status IS NULL OR OLD.status != 'scheduled') THEN
    INSERT INTO "AgendaItem" (
      "organizationId",
      "title",
      "scheduledTime",
      "status",
      "priority",
      "interviewId",
      "jobId",
      "candidateId",
      "createdById",
      "createdAt",
      "updatedAt"
    )
    SELECT
      i."organizationId",
      'Interview: ' || c."firstName" || ' ' || c."lastName" || ' - ' || j.title,
      NEW."scheduledAt",
      'pending',
      CASE
        WHEN NEW."scheduledAt" <= NOW() + INTERVAL '2 hours' THEN 'high'
        WHEN NEW."scheduledAt" <= NOW() + INTERVAL '24 hours' THEN 'medium'
        ELSE 'low'
      END,
      NEW.id,
      NEW."jobId",
      NEW."candidateId",
      (SELECT "userId" FROM "InterviewParticipant" WHERE "interviewId" = NEW.id AND "role" = 'coordinator' LIMIT 1),
      NOW(),
      NOW()
    FROM "Interview" i
    JOIN "Job" j ON j.id = NEW."jobId"
    JOIN "Candidate" c ON c.id = NEW."candidateId"
    WHERE i.id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_create_agenda_item_on_interview_scheduled
  AFTER INSERT OR UPDATE OF status, "scheduledAt" ON "Interview"
  FOR EACH ROW
  WHEN (NEW.status = 'scheduled')
  EXECUTE FUNCTION create_agenda_item_on_interview_scheduled();
```

#### Application-Level Hook Example

```typescript
// app/features/jobs-and-clients/jobs-and-clients-hooks.server.ts

/**
 * Create agenda item when interview is scheduled
 */
export async function createAgendaItemOnInterviewScheduled(
  interviewId: string,
  userId: string,
) {
  const db = getDatabase();
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
    include: {
      job: true,
      candidate: true,
    },
  });

  if (!interview || interview.status !== "scheduled") return;

  // Check if agenda item already exists
  const existingItem = await db.agendaItem.findFirst({
    where: {
      interviewId: interview.id,
      status: { not: "cancelled" },
    },
  });

  if (existingItem) return;

  // Calculate priority based on how soon the interview is
  const hoursUntilInterview = differenceInHours(
    interview.scheduledAt,
    new Date(),
  );
  const priority: AgendaItemPriority =
    hoursUntilInterview <= 2
      ? "high"
      : hoursUntilInterview <= 24
        ? "medium"
        : "low";

  await db.agendaItem.create({
    data: {
      organizationId: interview.organizationId,
      title: `Interview: ${interview.candidate.firstName} ${interview.candidate.lastName} - ${interview.job.title}`,
      scheduledTime: interview.scheduledAt,
      status: "pending",
      priority,
      interviewId: interview.id,
      jobId: interview.jobId,
      candidateId: interview.candidateId,
      createdById: userId,
    },
  });
}

/**
 * Create agenda items for funnel updates with approaching deadlines
 * This would typically run as a scheduled job (e.g., every hour)
 */
export async function createAgendaItemsForUrgentFunnelUpdates() {
  const db = getDatabase();
  const now = new Date();
  const twentyFourHoursFromNow = addHours(now, 24);

  // Find funnel updates with deadlines within 24 hours that don't have agenda items
  const urgentUpdates = await db.funnelUpdate.findMany({
    where: {
      status: { in: ["pending", "in_progress"] },
      deadline: {
        gte: now,
        lte: twentyFourHoursFromNow,
      },
      agendaItems: {
        none: {
          status: { not: "cancelled" },
        },
      },
    },
    include: {
      job: true,
      candidate: true,
    },
  });

  for (const update of urgentUpdates) {
    const hoursUntilDeadline = differenceInHours(update.deadline, now);
    const priority: AgendaItemPriority =
      hoursUntilDeadline <= 2
        ? "critical"
        : hoursUntilDeadline <= 6
          ? "high"
          : "medium";

    await db.agendaItem.create({
      data: {
        organizationId: update.organizationId,
        title: `Follow up: ${update.type.replace("_", " ")} - ${update.candidate.firstName} ${update.candidate.lastName}`,
        scheduledTime: update.deadline,
        status: "pending",
        priority,
        jobId: update.jobId,
        candidateId: update.candidateId,
        createdById: update.resolvedById || undefined, // Use resolver if available
        description: update.message,
      },
    });
  }
}

/**
 * Create agenda item for job posting expiration
 */
export async function createAgendaItemForJobExpiration(jobId: string) {
  const db = getDatabase();
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: {
      organization: true,
    },
  });

  if (!job || !job.postedAt) return;

  // Assume 30-day expiration period
  const expirationDate = addDays(job.postedAt, 30);
  const daysUntilExpiration = differenceInDays(expirationDate, new Date());

  // Create agenda item 3 days before expiration
  if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
    const existingItem = await db.agendaItem.findFirst({
      where: {
        jobId: job.id,
        title: { contains: "job posting expiration" },
        status: { not: "cancelled" },
      },
    });

    if (!existingItem) {
      await db.agendaItem.create({
        data: {
          organizationId: job.organizationId,
          title: `Job posting expiring soon: ${job.title}`,
          scheduledTime: expirationDate,
          status: "pending",
          priority: daysUntilExpiration === 1 ? "high" : "medium",
          jobId: job.id,
          description: `The job posting for "${job.title}" will expire on ${format(expirationDate, "MMM d, yyyy")}. Consider renewing or closing the position.`,
        },
      });
    }
  }
}
```

### AI Assistant Creation

The AI assistant can create both funnel updates and agenda items based on natural language requests from users.

#### AI Assistant Hook Example

```typescript
// app/features/jobs-and-clients/ai-assistant-actions.server.ts

/**
 * Parse AI request and create funnel update or agenda item
 */
export async function handleAICreationRequest(
  organizationId: string,
  userId: string,
  message: string,
  context?: {
    relatedEntityId?: string;
    relatedEntityType?: string;
  },
) {
  // Use AI to parse the intent and extract entities
  const aiResponse = await parseAICreationIntent(message, context);

  if (aiResponse.intent === "create_funnel_update") {
    return await createFunnelUpdateFromAIRequest(
      organizationId,
      userId,
      aiResponse,
    );
  }

  if (aiResponse.intent === "create_agenda_item") {
    return await createAgendaItemFromAIRequest(
      organizationId,
      userId,
      aiResponse,
    );
  }

  throw new Error("Unable to parse creation intent");
}

async function createFunnelUpdateFromAIRequest(
  organizationId: string,
  userId: string,
  aiResponse: {
    candidateName?: string;
    jobTitle?: string;
    type: FunnelUpdateType;
    deadline: Date;
    message: string;
    urgency: UrgencyLevel;
  },
) {
  const db = getDatabase();

  // Find candidate and job from AI-extracted names
  const candidate = aiResponse.candidateName
    ? await db.candidate.findFirst({
        where: {
          organizationId,
          OR: [
            { firstName: { contains: aiResponse.candidateName, mode: "insensitive" } },
            { lastName: { contains: aiResponse.candidateName, mode: "insensitive" } },
          ],
        },
      })
    : null;

  const job = aiResponse.jobTitle
    ? await db.job.findFirst({
        where: {
          organizationId,
          title: { contains: aiResponse.jobTitle, mode: "insensitive" },
        },
      })
    : null;

  if (!candidate || !job) {
    throw new Error("Could not find candidate or job from request");
  }

  const funnelUpdate = await db.funnelUpdate.create({
    data: {
      organizationId,
      jobId: job.id,
      candidateId: candidate.id,
      type: aiResponse.type,
      status: "pending",
      urgency: aiResponse.urgency,
      message: aiResponse.message,
      deadline: aiResponse.deadline,
    },
  });

  return funnelUpdate;
}

async function createAgendaItemFromAIRequest(
  organizationId: string,
  userId: string,
  aiResponse: {
    title: string;
    scheduledTime: Date;
    priority?: AgendaItemPriority;
    description?: string;
    relatedEntityId?: string;
    relatedEntityType?: AgendaRelatedEntityType;
  },
) {
  const db = getDatabase();

  const agendaItem = await db.agendaItem.create({
    data: {
      organizationId,
      title: aiResponse.title,
      scheduledTime: aiResponse.scheduledTime,
      status: "pending",
      priority: aiResponse.priority || "medium",
      description: aiResponse.description,
      relatedEntityId: aiResponse.relatedEntityId,
      relatedEntityType: aiResponse.relatedEntityType,
      createdById: userId,
    },
  });

  return agendaItem;
}
```

### Scheduled Jobs

Some agenda items are created by scheduled background jobs that check for conditions:

```typescript
// app/features/jobs-and-clients/jobs-and-clients-scheduled-jobs.server.ts

/**
 * Scheduled job to create agenda items for approaching deadlines
 * Runs every hour via cron or job queue
 */
export async function scheduledJobCreateUrgentAgendaItems() {
  const db = getDatabase();
  const organizations = await db.organization.findMany({
    select: { id: true },
  });

  for (const org of organizations) {
    await createAgendaItemsForUrgentFunnelUpdates(org.id);
    await createAgendaItemsForExpiringJobs(org.id);
  }
}

/**
 * Scheduled job to create funnel updates for overdue items
 * Runs daily to check for items that need follow-up
 */
export async function scheduledJobCreateOverdueFunnelUpdates() {
  const db = getDatabase();
  
  // Find interviews completed more than 24 hours ago without feedback
  const interviewsWithoutFeedback = await db.interview.findMany({
    where: {
      status: "completed",
      completedAt: { lte: subHours(new Date(), 24) },
      interviewerNotes: null,
      funnelUpdates: {
        none: {
          type: "interview_feedback",
          status: { in: ["pending", "in_progress"] },
        },
      },
    },
    include: {
      job: true,
      candidate: true,
    },
  });

  for (const interview of interviewsWithoutFeedback) {
    await createFunnelUpdateOnInterviewCompleted(interview.id);
  }
}
```

## Real-time Metric Updates

The key design principle for `PerformanceMetric` and `GrowthTrend` is that they are **updated in real-time** whenever relevant changes occur in the system. This makes reading data for charts simple and fast—just query the pre-calculated values.

### Update Triggers

Metrics and trends are updated automatically when these events occur:

#### Performance Metrics Updates

```typescript
// app/features/jobs-and-clients/jobs-and-clients-metrics.server.ts

/**
 * Update performance metrics when a job application stage changes
 */
export async function updateMetricsOnApplicationStageChange(
  organizationId: string,
  applicationId: string,
  oldStage: ApplicationStage,
  newStage: ApplicationStage,
) {
  const db = getDatabase();
  const application = await db.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) return;

  const now = new Date();
  const periodStart = startOfMonth(now);
  const periodEnd = endOfMonth(now);

  // If offer was accepted, increment placements
  if (newStage === "offer_accepted" && oldStage !== "offer_accepted") {
    await db.performanceMetric.upsert({
      where: {
        organizationId_label_periodStart_period: {
          organizationId,
          label: "Job Placements",
          periodStart,
          period: "monthly",
        },
      },
      update: {
        value: { increment: 1 },
        lastUpdatedAt: new Date(),
      },
      create: {
        organizationId,
        label: "Job Placements",
        value: 1,
        target: await getDefaultTarget(organizationId, "placements"),
        unit: "placements",
        period: "monthly",
        periodStart,
        periodEnd,
        lastUpdatedAt: new Date(),
        source: "auto_calculated",
      },
    });
  }

  // If offer was rejected/withdrawn after being accepted, decrement placements
  if (
    oldStage === "offer_accepted" &&
    (newStage === "offer_rejected" || newStage === "withdrawn")
  ) {
    await db.performanceMetric.update({
      where: {
        organizationId_label_periodStart_period: {
          organizationId,
          label: "Job Placements",
          periodStart,
          period: "monthly",
        },
      },
      data: {
        value: { decrement: 1 },
        lastUpdatedAt: new Date(),
      },
    });
  }

  // If new application created, increment active candidates
  // Note: This would typically be handled in the create handler, not update
  if (!oldStage && newStage === "applied") {
    await db.performanceMetric.upsert({
      where: {
        organizationId_label_periodStart_period: {
          organizationId,
          label: "Active Candidates",
          periodStart,
          period: "monthly",
        },
      },
      update: {
        value: { increment: 1 },
        lastUpdatedAt: new Date(),
      },
      create: {
        organizationId,
        label: "Active Candidates",
        value: 1,
        target: await getDefaultTarget(organizationId, "candidates"),
        unit: "candidates",
        period: "monthly",
        periodStart,
        periodEnd,
        lastUpdatedAt: new Date(),
        source: "auto_calculated",
      },
    });
  }
}

/**
 * Update performance metrics when an interview is scheduled
 */
export async function updateMetricsOnInterviewScheduled(
  organizationId: string,
  interviewId: string,
) {
  const db = getDatabase();
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) return;

  const scheduledDate = interview.scheduledAt;
  const periodStart = startOfMonth(scheduledDate);
  const periodEnd = endOfMonth(scheduledDate);

  // Increment interviews scheduled
  await db.performanceMetric.upsert({
    where: {
      organizationId_label_periodStart_period: {
        organizationId,
        label: "Interviews Scheduled",
        periodStart,
        period: "monthly",
      },
    },
    update: {
      value: { increment: 1 },
      lastUpdatedAt: new Date(),
    },
    create: {
      organizationId,
      label: "Interviews Scheduled",
      value: 1,
      target: await getDefaultTarget(organizationId, "interviews"),
      unit: "interviews",
      period: "monthly",
      periodStart,
      periodEnd,
      lastUpdatedAt: new Date(),
      source: "auto_calculated",
    },
  });

  // Also update growth trends
  await updateGrowthTrendsOnInterviewScheduled(organizationId, interview);
}

/**
 * Update performance metrics when an interview is cancelled
 */
export async function updateMetricsOnInterviewCancelled(
  organizationId: string,
  interviewId: string,
) {
  const db = getDatabase();
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) return;

  const scheduledDate = interview.scheduledAt;
  const periodStart = startOfMonth(scheduledDate);
  const periodEnd = endOfMonth(scheduledDate);

  // Decrement interviews scheduled
  await db.performanceMetric.update({
    where: {
      organizationId_label_periodStart_period: {
        organizationId,
        label: "Interviews Scheduled",
        periodStart,
        period: "monthly",
      },
    },
    data: {
      value: { decrement: 1 },
      lastUpdatedAt: new Date(),
    },
  });
}
```

#### Growth Trends Updates

```typescript
/**
 * Update growth trends when an interview is scheduled
 */
export async function updateGrowthTrendsOnInterviewScheduled(
  organizationId: string,
  interview: Interview,
) {
  const db = getDatabase();
  const interviewDate = interview.scheduledAt;
  const period = startOfMonth(interviewDate);

  // Update "Number of Interviews" trend
  const currentInterviewsTrend = await db.growthTrend.upsert({
    where: {
      organizationId_metric_period: {
        organizationId,
        metric: "Number of Interviews",
        period,
      },
    },
    update: {
      value: { increment: 1 },
      lastUpdatedAt: new Date(),
    },
    create: {
      organizationId,
      metric: "Number of Interviews",
      period,
      value: 1,
      lastUpdatedAt: new Date(),
    },
  });

  // Calculate and update comparison data for current month
  if (isSameMonth(period, new Date())) {
    const previousPeriod = subMonths(period, 1);
    const previousTrend = await db.growthTrend.findUnique({
      where: {
        organizationId_metric_period: {
          organizationId,
          metric: "Number of Interviews",
          period: previousPeriod,
        },
      },
    });

    if (previousTrend) {
      const changePercentage =
        previousTrend.value > 0
          ? ((currentInterviewsTrend.value - previousTrend.value) /
              previousTrend.value) *
            100
          : 0;

      await db.growthTrend.update({
        where: { id: currentInterviewsTrend.id },
        data: {
          previousPeriodValue: previousTrend.value,
          changePercentage,
        },
      });
    }
  }

  // Update "Number of Roles Interviewed For" trend
  // This counts distinct jobs that have interviews
  const job = await db.job.findUnique({
    where: { id: interview.jobId },
  });

  if (job) {
    // Check if this is the first interview for this job this month
    const existingJobInterviews = await db.interview.count({
      where: {
        jobId: job.id,
        scheduledAt: {
          gte: period,
          lt: endOfMonth(period),
        },
      },
    });

    // Only increment if this is the first interview for this job this month
    if (existingJobInterviews === 1) {
      const currentRolesTrend = await db.growthTrend.upsert({
        where: {
          organizationId_metric_period: {
            organizationId,
            metric: "Number of Roles Interviewed For",
            period,
          },
        },
        update: {
          value: { increment: 1 },
          lastUpdatedAt: new Date(),
        },
        create: {
          organizationId,
          metric: "Number of Roles Interviewed For",
          period,
          value: 1,
          lastUpdatedAt: new Date(),
        },
      });

      // Calculate and update comparison data for current month
      if (isSameMonth(period, new Date())) {
        const previousPeriod = subMonths(period, 1);
        const previousTrend = await db.growthTrend.findUnique({
          where: {
            organizationId_metric_period: {
              organizationId,
              metric: "Number of Roles Interviewed For",
              period: previousPeriod,
            },
          },
        });

        if (previousTrend) {
          const changePercentage =
            previousTrend.value > 0
              ? ((currentRolesTrend.value - previousTrend.value) /
                  previousTrend.value) *
                100
              : 0;

          await db.growthTrend.update({
            where: { id: currentRolesTrend.id },
            data: {
              previousPeriodValue: previousTrend.value,
              changePercentage,
            },
          });
        }
      }
    }
  }
}
```

### Integration Points

These update functions should be called from:

1. **Job Application Actions**: When application stage changes
   ```typescript
   // In your job application update handler
   await updateApplicationStage(applicationId, newStage);
   await updateMetricsOnApplicationStageChange(
     organizationId,
     applicationId,
     oldStage,
     newStage,
   );
   ```

2. **Interview Actions**: When interview is created, cancelled, or status changes
   ```typescript
   // In your interview creation handler
   const interview = await createInterview(data);
   await updateMetricsOnInterviewScheduled(organizationId, interview.id);
   ```

3. **Database Hooks/Triggers**: Using Prisma middleware or database triggers
   ```typescript
   // Prisma middleware example
   db.$use(async (params, next) => {
     const result = await next(params);
     
     if (params.model === "JobApplication" && params.action === "update") {
       // Check if stage changed
       if (params.args.data.stage) {
         await updateMetricsOnApplicationStageChange(
           params.args.where.organizationId,
           params.args.where.id,
           result.stage, // old stage
           params.args.data.stage, // new stage
         );
       }
     }
     
     return result;
   });
   ```

### Benefits of Real-time Updates

1. **Fast Reads**: Charts load instantly—no expensive calculations
2. **Always Accurate**: Data is always up-to-date, no stale cache
3. **Scalable**: Updates are incremental (O(1)) rather than recalculating everything
4. **Simple Queries**: Loaders just read pre-calculated values
5. **Consistent**: All users see the same data at the same time

## API and Server Functions

### Model Functions Structure

```
app/features/jobs-and-clients/
├── jobs-and-clients-model.server.ts    # Database query functions
├── jobs-and-clients-action.server.ts   # Action handlers
├── jobs-and-clients-loader.server.ts   # Loader logic (optional separation)
└── jobs-and-clients-helpers.server.ts  # Server-side utilities
```

### Key Server Functions

```typescript
// Database queries
- getUrgentFunnelUpdates(organizationId: string): Promise<UrgentFunnelUpdate[]>
- getDailyAgenda(organizationId: string, date: Date): Promise<AgendaItem[]>
- getCalendarEvents(organizationId: string, date: Date): Promise<CalendarEvent[]>
- getPerformanceMetrics(organizationId: string, month: Date): Promise<PerformanceMetric[]>
- getGrowthTrends(organizationId: string): Promise<GrowthTrend[]>
- getChatMessages(organizationId: string, userId: string): Promise<ChatMessage[]>

// Mutations
- sendFunnelUpdateReminder(updateId: string, userId: string): Promise<void>
- toggleAgendaItemStatus(itemId: string, status: AgendaItemStatus): Promise<AgendaItem>
- createCalendarEvent(data: CreateCalendarEventInput): Promise<CalendarEvent>
- updateCalendarEvent(eventId: string, data: UpdateCalendarEventInput): Promise<CalendarEvent>
- deleteCalendarEvent(eventId: string): Promise<void>
- sendChatMessage(organizationId: string, userId: string, content: string): Promise<ChatMessage>
```

## Performance Considerations

### Database Indexing

Critical indexes for performance:

```prisma
// FunnelUpdate
@@index([organizationId, status, deadline])
@@index([organizationId, urgency, deadline])

// AgendaItem
@@index([organizationId, scheduledTime])
@@index([organizationId, status, scheduledTime])

// CalendarEvent
@@index([organizationId, startTime])
@@index([organizationId, endTime])

// PerformanceMetric
@@index([organizationId, periodStart, period])
@@index([organizationId, period, periodStart])

// GrowthTrend
@@index([organizationId, metric, period])
@@index([organizationId, period])

// JobApplication
@@index([jobId, stage])
@@index([candidateId])

// Interview
@@index([organizationId, scheduledAt])
@@index([status, scheduledAt])
```

### Caching Strategy

With the real-time update approach, caching is simplified:

1. **Performance Metrics**: No cache needed—values are updated in real-time, reads are simple queries
2. **Growth Trends**: No cache needed—values are updated in real-time, reads are simple queries
3. **Daily Agenda**: Cache for 5 minutes (frequently updated, but not critical)
4. **Calendar Events**: Cache for 15 minutes (rarely changes after creation)
5. **Urgent Funnel Updates**: No cache (real-time critical)

### Query Optimization

- Use `select` to limit fields returned
- Use `include` judiciously (only when needed)
- Batch related queries with `Promise.all()`
- Use database-level aggregations for metrics
- Consider materialized views for complex aggregations

### Pagination

For large datasets:
- Urgent Funnel Updates: Limit to top 10
- Daily Agenda: All items for the day (typically < 50)
- Calendar Events: All events for the day
- Chat Messages: Paginate with cursor-based pagination

## Security and Access Control

### Organization Scoping

All queries must filter by `organizationId`:

```typescript
// ✅ Correct
await db.job.findMany({
  where: { organizationId },
});

// ❌ Wrong - security risk
await db.job.findMany();
```

### User Permissions

Check organization membership before operations:

```typescript
async function requireOrganizationMembership(
  userId: string,
  organizationSlug: string,
): Promise<Organization> {
  const membership = await db.organizationMembership.findFirst({
    where: {
      memberId: userId,
      organization: { slug: organizationSlug },
      deactivatedAt: null,
    },
    include: { organization: true },
  });

  if (!membership) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return membership.organization;
}
```

### Data Validation

- Validate all user inputs with Zod schemas
- Sanitize text inputs to prevent XSS
- Validate date ranges (prevent querying too far in past/future)
- Rate limit actions (prevent spam)

### Audit Trail

Consider adding audit logs for sensitive operations:
- Funnel update reminders sent
- Agenda item status changes
- Calendar event modifications
- Performance metric calculations

## Conclusion

This implementation guide provides a comprehensive foundation for building the Jobs and Clients feature with real database integration. The schema is designed to be:

- **Scalable**: Indexes and efficient queries support growth
- **Maintainable**: Clear relationships and separation of concerns
- **Secure**: Organization-scoped data with proper access control
- **Performant**: Caching strategies and optimized queries
- **Extensible**: Easy to add new features and relationships

The data flow follows React Router best practices with loaders for data fetching and actions for mutations, ensuring a smooth user experience with optimistic updates and proper error handling.
