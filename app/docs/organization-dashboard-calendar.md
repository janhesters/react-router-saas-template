# Organization Dashboard – Calendar & Agenda Architecture

This document describes how the current **mocked** dashboard implementation (calendar, Daily Agenda, Urgent Funnel Updates, AI Assistant panel) would be implemented as a real production feature.

The focus is on:

- **Data model & database structure**
- **Backend/service layer**
- **Remix route data flow (loader/action)**
- **How this maps to the existing `dashboard.tsx` implementation**

> All examples below are technology-agnostic at the DB level (you can use Postgres, MySQL, etc.) and assume a typical TypeScript ORM or query builder on the backend.

---

## 1. Data model

### 1.1 Core entities

The dashboard as implemented today conceptually works with:

- An **Organization** (identified by `organizationSlug` in the route)
- **Users/Recruiters** who belong to that organization
- **Calendar events** that are displayed in the main calendar and Daily Agenda

To support this, we would introduce at least the following tables:

#### `organizations`

```sql
organizations (
  id               uuid primary key,
  slug             text unique not null,
  name             text not null,
  created_at       timestamptz not null default now()
);
```

#### `users`

```sql
users (
  id               uuid primary key,
  organization_id  uuid not null references organizations(id),
  email            text not null unique,
  name             text,
  timezone         text,               -- e.g. "Europe/Berlin", optional
  created_at       timestamptz not null default now()
);
```

#### `calendar_events`

Rather than storing just an hour range (like the current mock), we store full timestamps in UTC:

```sql
calendar_events (
  id               uuid primary key,
  organization_id  uuid not null references organizations(id),

  title            text not null,
  description      text,

  start_at         timestamptz not null,
  end_at           timestamptz not null,

  source           text,    -- e.g. 'ats', 'calendar', 'ai_suggestion'
  importance       text,    -- e.g. 'low' | 'medium' | 'high'
  status           text,    -- e.g. 'scheduled' | 'completed' | 'cancelled'

  metadata         jsonb,   -- candidate id, job id, etc.

  created_by       uuid references users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
```

Key points:

- **`start_at`/`end_at` are in UTC**. We compute local dates/hours for the UI in the loader.
- `metadata` can link the event to candidates, jobs, or ATS data without coupling the UI to a specific schema.
- Fields like `importance` and `status` are available for future filtering and styling (e.g. urgent vs. normal events).

> If we later need **availability slots** (distinct from actual events), we would add a separate `availability_slots` table. For this dashboard feature, a single `calendar_events` table is enough.

---

## 2. Backend/service layer

To keep the Remix route lean and testable, we introduce a small service module, e.g.:

`app/features/calendar/server/calendar-service.ts`

This module will:

- Provide **query functions** for dashboard consumption
- Encapsulate **time zone logic**
- Convert raw DB rows into convenient domain objects

### 2.1 Domain types

```ts
export type CalendarEventRecord = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  startAt: Date;          // JS Date in UTC
  endAt: Date;            // JS Date in UTC
  importance: "low" | "medium" | "high";
  status: "scheduled" | "completed" | "cancelled";
  metadata: Record<string, unknown>;
};
```

### 2.2 Fetching events for a given day

The dashboard calendar is **day-based**: we show all events that intersect the selected date in the users timezone.

```ts
export async function getEventsForDay(opts: {
  organizationId: string;
  day: Date;          // local date (no time)
  timezone: string;   // IANA timezone, e.g. "Europe/Berlin"
}): Promise<CalendarEventRecord[]> {
  const { organizationId, day, timezone } = opts;

  // 1. Compute local start/end of the given day and convert to UTC.
  const startOfDay = startOfLocalDay(day, timezone); // Date in UTC
  const endOfDay = endOfLocalDay(day, timezone);     // Date in UTC

  // 2. Query DB for events that overlap this range.
  // Pseudo SQL:
  //   SELECT * FROM calendar_events
  //   WHERE organization_id = :organizationId
  //     AND start_at < :endOfDay
  //     AND end_at   > :startOfDay

  // 3. Map DB rows into CalendarEventRecord objects.
}
```

Helper functions `startOfLocalDay` and `endOfLocalDay` can be implemented using `date-fns-tz`, Luxon, or another timezone-aware library.

> This function returns **all events that overlap the day**, including events that start before midnight or end after midnight.

---

## 3. Remix route data flow

The current route (`dashboard.tsx`) already has a clean separation:

- **Loader**: returns `events` and `pageTitle` (currently mocked)
- **Component**: uses `useLoaderData` and local state (`selectedDate`, `selectedItem`) to drive the calendar + agenda

To make this real, we keep the same **UI shape** but change **where data comes from**.

### 3.1 Loader: from DB to UI-friendly structure

Today, the loader returns:

```ts
const events: CalendarEvent[] = [
  {
    id: 1,
    date: "2025-11-29",
    title: "AI Candidate Screening",
    startHour: 8,
    endHour: 11,
  },
  // ...
];
```

For a real implementation, we:

1. Fetch events from `calendar_events` using `getEventsForDay`.
2. Map them into the **same simplified shape** the component already expects.

Example:

```ts
type UiCalendarEvent = {
  id: string;
  date: string;     // 'YYYY-MM-DD' in the user's timezone
  title: string;
  startHour: number;
  endHour: number;
};

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  const organizationSlug = params.organizationSlug!;
  const user = await requireUser(context);          // implementation-specific

  const timezone = user.timezone ?? "UTC";
  const selectedDate = getSelectedDateFromUrl(request) ?? new Date();

  const organization = await getOrganizationBySlug(organizationSlug);
  const rawEvents = await getEventsForDay({
    organizationId: organization.id,
    day: selectedDate,
    timezone,
  });

  const events: UiCalendarEvent[] = rawEvents.map((e) => {
    const localStart = toLocalTZ(e.startAt, timezone);
    const localEnd = toLocalTZ(e.endAt, timezone);

    return {
      id: e.id,
      date: toDateKey(localStart),           // reuses existing helper
      title: e.title,
      startHour: localStart.getHours(),
      endHour: localEnd.getHours(),
    };
  });

  return {
    breadcrump: {
      title: t("organizations:dashboard.breadcrumb"),
      to: href("/organizations/:organizationSlug/dashboard", {
        organizationSlug,
      }),
    },
    pageTitle: getPageTitle(t, "organizations:dashboard.pageTitle"),
    events,
    selectedDate: toDateKey(selectedDate),
  };
}
```

The **component code** (`OrganizationDashboardRoute`) can remain almost exactly as it is now:

- It already uses `useLoaderData<typeof loader>()`.
- It already derives `eventsForDay` by filtering `loaderData.events` by date key.
- The calendar grid and Daily Agenda are driven by `eventsForDay` and the hour range.

The only meaningful change would be **initializing** `selectedDate` from `loaderData.selectedDate` instead of a fixed date string.

### 3.2 Actions: creating/updating events

If the dashboard should support writing changes (e.g. scheduling a new interview by clicking on a slot), we add an `action` that:

1. Reads an `_intent` from form data.
2. Validates and normalizes input.
3. Persists to `calendar_events` using a service function.

Simplified example:

```ts
export async function action({ request, params, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("_intent");

  switch (intent) {
    case "create-event": {
      const title = formData.get("title") as string;
      const date = formData.get("date") as string;          // 'YYYY-MM-DD'
      const startHour = Number(formData.get("startHour"));  // 0-23
      const endHour = Number(formData.get("endHour"));

      const user = await requireUser(context);
      const timezone = user.timezone ?? "UTC";
      const organization = await getOrganizationBySlug(params.organizationSlug!);

      const { startAt, endAt } = toUtcRangeFromLocalDayAndHours({
        date,
        startHour,
        endHour,
        timezone,
      });

      await createCalendarEvent({
        organizationId: organization.id,
        title,
        startAt,
        endAt,
        createdBy: user.id,
      });

      // Refresh dashboard, optionally preserving ?date=
      return redirect(request.url);
    }

    // Additional intents: update-event, delete-event, etc.
  }
}
```

This mirrors how the current UI treats slots and events:

- Clicking a **slot** could open a modal prefilled with `date` and `startHour`.
- Submitting the form calls the `create-event` intent.
- The loader re-fetches events and the dashboard updates.

---

## 4. Mapping to the current implementation

### 4.1 Calendar grid & event layout

The current `dashboard.tsx` already:

- Defines an hour range `CALENDAR_HOURS = [0..23]`.
- Renders a fixed grid of hour rows.
- Places events absolutely based on `startHour` and `endHour`.
- Computes past/future/current coloring in `getEventTimeColorClass`.

When using real data:

- `startHour` and `endHour` simply come from transforming `start_at`/`end_at` in the loader.
- `date` is derived from the local start date of each event.
- The front-end event selection and display logic does **not** need to change.

### 4.2 Daily Agenda

The Daily Agenda currently consumes:

- `eventsForDay` derived from `loaderData.events` and `selectedDateKey`.

With real data:

- The **shape of `eventsForDay` remains the same**.
- The agenda automatically displays whatever events were loaded from the database.
- We have already constrained the agenda height and made its list scrollable, which still applies with real data.

### 4.3 Urgent Funnel Updates & AI Assistant

In a real system, these would likely be driven by other backends (ATS, AI services), but the data flow is similar:

- Loader fetches the **top N urgent items** from an internal service, shaped for UI consumption.
- Loader fetches **conversation/context** for the AI panel (or leaves it mocked if the AI is not yet wired).

The README focuses on calendar/agenda because thats where the main data flow and DB work happens, but the same pattern applies: loader → service functions → domain records → UI-friendly objects.

---

## 5. Summary of responsibilities

- **Database layer**
  - Defines normalized tables (`organizations`, `users`, `calendar_events`).
  - Stores timestamps in UTC, plus metadata for linking to other systems.

- **Service layer (`calendar-service`)**
  - Hides SQL/ORM details.
  - Encapsulates timezone logic.
  - Exposes clean functions like `getEventsForDay`, `createCalendarEvent`, `updateCalendarEvent`.

- **Remix route (`dashboard.tsx`)**
  - Loader:
    - Resolves organization and user.
    - Determines selected date and timezone.
    - Calls calendar services.
    - Maps domain events into UI-friendly `UiCalendarEvent` objects.
  - Action (optional):
    - Handles form submissions for creating/updating events.

- **React component (`OrganizationDashboardRoute`)**
  - Stays almost identical to the current mock implementation.
  - Uses `useLoaderData` and local state for:
    - Selected date & navigation (prev/next/today).
    - Selected slot/event.
    - Rendering Daily Agenda and selection details.

With this structure, moving from the current mocked implementation to a real, DB-backed feature is primarily a matter of:

1. Implementing the DB schema and service functions.
2. Updating the loader to call those services and map results.
3. (Optionally) adding actions and forms for creating/updating events.

The **visual calendar behavior and interaction model** we have today already matches what a production-ready feature would look like.
