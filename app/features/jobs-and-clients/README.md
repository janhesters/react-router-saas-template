# Jobs and Clients Dashboard

## Overview

I appreciate being shortlisted to take part in this stage of the interview. This document outlines my understanding of the assessment and details how I would implement the full feature logic if this were a production application.

The Jobs and Clients dashboard serves as the central hub for recruiters and HR teams to manage their hiring pipeline. It provides:

- **Urgent Funnel Updates**: Real-time notifications for candidates requiring immediate attention
- **Daily Agenda**: Time-sensitive tasks for the current day
- **Calendar View**: Scheduled interviews, screenings, and meetings
- **Hiring Goals**: Progress tracking toward placement targets
- **Quick Stats**: Key pipeline metrics at a glance
- **AI Assistant**: Contextual help for candidate queries and task automation

This implementation contains only the UI layer with mock data, as specified in the assessment instructions. The sections below describe how I would structure the database and data flow for a real implementation.

---

## Database Schema

The schema leverages the existing `UserAccount` and `Organization` tables from the template for authentication and multi-tenancy. All new tables include an `organization_id` foreign key to ensure proper data isolation via Supabase Row Level Security (RLS) policies.

### Entity Relationships

```
Organization (existing)
    │
    ├── Client (1:N)
    │       │
    │       └── Job (1:N)
    │               │
    │               ├── JobApplication (1:N)
    │               │       │
    │               │       ├── Candidate (N:1)
    │               │       ├── CalendarEvent (1:N)
    │               │       ├── AgendaTask (1:N)
    │               │       └── FunnelUpdate (1:N)
    │               │
    │               └── HiringGoal (1:1)
    │
    └── UserAccount (existing, referenced for assignments)
```

### Tables

| Table | Purpose |
|-------|---------|
| **Client** | Stores client companies that have hiring needs. Enables client-level reporting and relationship management. Fields include name, industry, contact info, and status. |
| **Job** | Represents open positions for each client. Tracks title, requirements, salary range, location, employment type, status (draft/open/on-hold/filled/closed), and priority level. |
| **Candidate** | Stores candidate profiles independently of jobs to enable talent pool management. A candidate can be considered for multiple positions over time. Contains PII fields (name, email, phone) which would require encryption at rest and access logging for compliance. |
| **JobApplication** | For tracking a candidate's journey through the hiring funnel for a specific job. Stores the current stage (applied → screening → interview → offer → hired/rejected) and timestamps for stage transitions. |
| **CalendarEvent** | Stores scheduled interviews, screenings, and meetings. Links to job applications for context. Includes fields for external calendar sync (Google Calendar event IDs). |
| **AgendaTask** | Time-sensitive tasks for the daily workflow, separate from calendar events. Linked to job applications when relevant. Tracks completion status. |
| **HiringGoal** | Tracks progress toward placement targets (e.g., "Senior Engineers: 2/5 hired"). Links to specific jobs with target and current hire counts. |
| **FunnelUpdate** | System-generated notifications for candidates needing immediate action. Stores priority, action type, and read/dismissed status. |

### Indexing Strategy

Performance indexes would be created for common query patterns:
- Organization-scoped queries (all tables)
- Date-range queries (calendar events, agenda tasks)
- Status filtering (jobs, applications)
- Unread notifications (funnel updates)

---

## Data Flow

### Component-Level Loading States

Rather than blocking the entire page until all data loads, each dashboard component fetches its data independently using React Router's deferred data pattern. This approach:

- Renders static UI elements (headers, navigation, component shells) immediately
- Shows skeleton loaders within each component while its data is fetched
- Allows components to become interactive as soon as their data arrives
- Improves perceived performance, especially on slower connections

**Pseudo-code for deferred loading:**

```
loader:
  return defer({
    funnelUpdates: fetchFunnelUpdates(),      // Promise
    agendaTasks: fetchAgendaTasks(),          // Promise
    calendarEvents: fetchCalendarEvents(),    // Promise
    hiringGoals: fetchHiringGoals(),          // Promise
    pipelineStats: fetchPipelineStats()       // Promise
  })

component:
  <Suspense fallback={<FunnelUpdatesSkeleton />}>
    <Await resolve={funnelUpdates}>
      {data => <UrgentFunnelUpdates data={data} />}
    </Await>
  </Suspense>
```

### API Structure

Mutations would use React Router actions with an intent-based pattern:

**Pseudo-code for actions:**

```
action(request, params):
  user = requireAuthentication(request)
  intent = getFormIntent(request)
  
  switch intent:
    case "complete-task":
      updateTask(params.id, { completed: true, completedAt: now() })
      
    case "dismiss-update":
      updateFunnelUpdate(params.id, { dismissed: true })
      
    case "create-event":
      validateEventData(formData)
      insertCalendarEvent(formData)
      if externalCalendarConnected:
        syncToExternalCalendar(event)
```

### Real-Time Updates

For live data synchronization, I would use Supabase Realtime subscriptions on tables where immediate updates matter:

- **Funnel Updates**: New urgent items appear immediately when another team member creates them
- **Calendar Events**: Schedule changes sync across devices and from external calendars
- **Agenda Tasks**: Completion status syncs when a task is marked done on another device

The subscription pattern would filter by `organization_id` and trigger a revalidation of the relevant loader data when changes occur.

### Internal Event System

For actions that trigger side effects within the system, I would implement an internal event pattern:

| Trigger | Event | Side Effects |
|---------|-------|--------------|
| Candidate moves to "Interview" stage | `application.stage_changed` | Create calendar event prompt, generate funnel update for scheduling |
| Candidate moves to "Offer" stage | `application.stage_changed` | Create agenda task for sending offer letter, update hiring goal progress |
| Candidate hired | `application.hired` | Increment hiring goal `current_hires`, archive related funnel updates |
| Interview scheduled | `calendar_event.created` | Remove "needs scheduling" funnel update, sync to external calendar |
| Task overdue | `agenda_task.overdue` (cron) | Generate high-priority funnel update |
| External calendar sync | `calendar.synced` | Update/create calendar events, trigger revalidation |

**Pseudo-code for event handling:**

```
onApplicationStageChange(application, previousStage, newStage):
  if newStage == "interview":
    createFunnelUpdate({
      applicationId: application.id,
      title: "Schedule interview",
      priority: "high",
      actionType: "schedule"
    })
    
  if newStage == "offer":
    createAgendaTask({
      applicationId: application.id,
      title: "Send offer letter to " + candidate.name,
      dueDate: today + 1 day
    })
    
  if newStage == "hired":
    incrementHiringGoal(application.jobId)
    dismissRelatedFunnelUpdates(application.id)
```

This event system could be implemented via:
- Supabase Database Functions (triggers) for synchronous side effects
- Supabase Edge Functions for async processing
- A dedicated event queue for complex workflows

---

## Calendar Integration

### External Calendar Sync (Google Calendar)

**OAuth Flow:**
1. User initiates connection from settings
2. Redirect to Google OAuth consent screen with calendar scope
3. On callback, exchange code for tokens and store encrypted refresh token
4. Trigger initial sync of upcoming events

**Sync Strategy:**
- **Inbound**: Background job polls Google Calendar API periodically (every 5-15 minutes) for changes. Alternatively, use Google Push Notifications for near-instant updates.
- **Outbound**: When an interview is scheduled in the app, create corresponding Google Calendar event with meeting link.
- **Conflict Resolution**: External calendar is source of truth for externally-created events. App-created events are identified by a custom property.

**Security Note**: OAuth refresh tokens would be encrypted at rest using envelope encryption. Token refresh happens server-side only.

---

## AI Assistant Implementation

The AI sidebar provides contextual help for recruiters:

- **Candidate Queries**: "Show me all candidates in the interview stage for the Senior Engineer role"
- **Message Drafting**: "Draft a rejection email for candidates who didn't pass screening"
- **Scheduling Suggestions**: "Find available slots for an interview with John next week"
- **Pipeline Insights**: "Which jobs have the longest time-to-hire?"

### LLM Integration

My preferred approach is to use either **Vercel AI SDK** or **LangChain** for LLM integration:

**Vercel AI SDK** provides:
- Streaming responses out of the box
- Built-in React hooks for chat interfaces
- Tool/function calling support
- Easy provider switching (OpenAI, Anthropic, etc.)

**LangChain** provides:
- Structured chains for complex workflows
- Built-in memory management for conversations
- Agent patterns for multi-step reasoning
- Extensive tool ecosystem

**Pseudo-code for AI query processing:**

```
processAIQuery(message, context):
  systemPrompt = buildContextAwarePrompt({
    currentPage: context.page,
    selectedCandidate: context.candidate,
    selectedJob: context.job,
    userRole: context.userRole
  })
  
  tools = [
    queryCandidatesTool,
    draftEmailTool,
    findAvailableSlotsTool,
    getPipelineStatsTool
  ]
  
  response = streamText({
    model: getOrganizationModel(context.orgId),
    system: systemPrompt,
    messages: conversationHistory,
    tools: tools
  })
  
  return response
```

### BYOK (Bring Your Own Key)

For enterprise multi-tenancy, organizations would manage their own API keys:

- **Cost Transparency**: Each organization pays for their own LLM usage directly
- **Compliance**: Sensitive candidate data stays within their own API relationship
- **Model Choice**: Organizations can choose their preferred provider/model
- **Security**: API keys encrypted at rest using envelope encryption

This pattern is similar to how tools like T3Chat handle enterprise API key management via WorkOS.

---

## Conclusion

This document outlines how I would approach building the Jobs and Clients feature as a production system. The database schema is designed for proper data isolation and relationship management. The data flow leverages React Router v7's deferred loading for component-level loading states, combined with Supabase Realtime for live updates. The internal event system ensures side effects are handled consistently when key actions occur.

---

## AI Usage Declaration

I used AI assistance during this assessment for the following:

- **Documentation formatting**: Helping structure and articulate my thoughts clearly for this README
- **Mock data generation**: Expanding mock data to 5 items per component to simulate realistic data scenarios
- **Commit messages**: Crafting descriptive and consistent commit messages
- **Ideation and planning**: Discussing implementation approaches and architectural decisions
- **Research**: Exploring best practices for calendar integration, real-time updates, and LLM integration patterns
- **Code implementation**: Assisting with component structure, TypeScript types, and Tailwind styling

---

## Learning Outcomes

This assessment provided an opportunity to deepen my understanding of React Router v7 patterns and concepts. Working through the dashboard implementation reinforced how the router's newer features can be combined to build more responsive, maintainable data flows and richer UX.

I learned how and when to use the useRevalidator hook to manually trigger loader revalidation. This hook is particularly useful when external events such as Supabase Realtime subscriptions modify data outside the normal React Router flow, when you need to refresh data without performing a full page reload, or when you must synchronize UI state after WebSocket or server-sent events. Using useRevalidator lets the app react to out-of-band updates while preserving the router’s loader semantics.

I also explored several core React Router patterns. Actions implement an intent-based pattern that lets a single route handle multiple operations in a clear, centralized way. Deferred data means returning promises from loaders instead of awaiting them, enabling streaming and component-level loading states that make the UI feel faster. Combining Suspense with Await works hand in hand with deferred loaders to show skeleton loaders or placeholders while individual promises resolve, allowing each component to become interactive as its data arrives. Finally, adopting a type-safe routes convention generates route-specific types for loader data, action data, and params, which improves developer ergonomics and reduces runtime errors.

Thank you for taking the time to review my submission. I appreciate the opportunity to participate in this assessment and would welcome the chance to discuss any part of the design or implementation in more detail.
