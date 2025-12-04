# Jobs and Clients Feature Implementation Guide

## Overview

This guide documents the implementation of the `jobs-and-clients` feature using **TanStack Start** (full-stack React framework) and **TanStack DB** (reactive client-side state management). The architecture follows **Clean Architecture** principles with clear separation between data, domain, and UI layers, using **Functional Programming** patterns for pure, testable code.

### Why TanStack Start?

- **File-based routing**: Co-located routes with server handlers and components
- **Type-safe server functions**: End-to-end type safety from database to UI
- **SSR & streaming**: Built-in server-side rendering and streaming support
- **Unified primitives**: Same APIs for server and client code
- **Seamless integration**: Works perfectly with TanStack DB, Query, and Router

### What I Build

1. **Database Layer**: Prisma models for jobs, clients, candidates, events, and tasks
2. **Server Layer**: TanStack Start server routes (REST) or server functions (RPC) for data access
3. **Data Layer**: TanStack DB query-backed collections with reactive live queries
4. **Domain Layer**: Custom hooks that transform raw data into UI-oriented view models
5. **UI Layer**: Presentational components that consume decoupled view model contracts

### Key Benefits

- **Reactive updates**: Live queries automatically update UI when data changes
- **Optimistic mutations**: Instant UI feedback with automatic rollback on errors
- **Type safety**: End-to-end TypeScript types from database to components
- **Testability**: Pure transformation functions are easy to unit test
- **Maintainability**: Clear separation of concerns makes code easy to modify

---

## Architecture Overview

The implementation follows a **three-layer architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│ UI Layer (Presentational Components)                            │
│ - ClientSnapshot, CurrentVacancies, LiveCalendar, Agenda       │
│ - Pure functions mapping view models to JSX                     │
│ - No awareness of data source, TanStack DB, or Prisma          │
│ - Receives view models as props                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ view models
┌────────────────────────▼────────────────────────────────────────┐
│ Domain/Service Layer (Custom Hooks)                             │
│ - useJobsAndClients: queries collections, returns view models │
│ - Pure transformation functions (toVacancyViewModel, etc.)      │
│ - Derived values and computed properties                        │
│ - Acts as translation layer between data and UI                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ Prisma types
┌────────────────────────▼────────────────────────────────────────┐
│ Data Layer (TanStack DB Collections)                            │
│ - useLiveQuery for reactive data fetching                       │
│ - Collections: jobs, clients, tasks, calendarEvents             │
│ - Optimistic mutations with automatic rollback                  │
│ - Direct Prisma types from server                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP requests
┌────────────────────────▼────────────────────────────────────────┐
│ Server Layer (TanStack Start)                                   │
│ - Server routes: REST endpoints (server.handlers)              │
│ - Server functions: type-safe RPC (createServerFn)                │
│ - Prisma queries return JSON to TanStack DB collections         │
│ - Handles authentication, validation, business logic            │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Direction

1. **Downward (Server → UI)**: Server → Collections → Hooks → Components
2. **Upward (UI → Server)**: Components → Collections → Server (via mutations)

---

## Feature-Sliced Project Structure

Feature code is organized by responsibility under `src/features/organizations/jobs-and-clients`:

```
src/
  features/
    organizations/
      jobs-and-clients/
        data/
          collections.ts       # TanStack DB query-backed collections
          view-models.ts      # TypeScript interfaces for UI contracts
          transformers.ts     # Pure functions: Prisma types → ViewModels
        hooks/
          use-jobs-and-clients.ts  # Main hook: queries collections, returns view models
        components/
          ClientSnapshot.tsx
          CurrentVacancies.tsx
          LiveCalendar.tsx
          Agenda.tsx
        utils/
          date.ts             # Date formatting helpers
          formatting.ts        # Text/number formatting
  routes/
    organizations_+/
      $organizationSlug+/
        jobs-and-clients.tsx  # Route component
    api+/
      jobs.ts                 # Server route: GET /api/jobs
      jobs/
        $id.ts                # Server route: GET/PUT/DELETE /api/jobs/:id
  server/
    jobs.ts                   # Server functions (optional RPC approach)
```

### Directory Responsibilities

- **`data/`**: TanStack DB collections, view model type definitions, pure transformation functions
- **`hooks/`**: Feature-specific hooks that query collections and return transformed view models
- **`components/`**: Presentational components. No data fetching, no Prisma/TanStack DB types
- **`utils/`**: Pure helper functions specific to this feature
- **`routes/`**: TanStack Start route files with optional loaders
- **`server/`**: Server functions for type-safe RPC (alternative to REST routes)

---

## Database Structure (Prisma Schema)

Minimal models to support the feature:

```prisma
model Job {
  id                String    @id @default(cuid(2))
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  title             String
  description       String    @db.Text
  location          String
  salaryMin         Int?
  salaryMax         Int?
  total             Int
  hired             Int       @default(0)
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  clientId          String
  client            Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  candidates        JobCandidate[]

  @@index([organizationId])
  @@index([clientId])
}

model Client {
  id                String    @id @default(cuid(2))
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  name              String
  imageUrl          String    @default("")
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  jobs              Job[]
  totalHired        Int       @default(0)

  @@index([organizationId])
}

model Candidate {
  id                String    @id @default(cuid(2))
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  name              String
  email             String
  imageUrl          String    @default("")
  resume            String?   @db.Text
  skills            String[]  @default([])
  yearsOfExperience Int?
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  jobApplications   JobCandidate[]

  @@unique([organizationId, email])
  @@index([organizationId])
}

model JobCandidate {
  id                String    @id @default(cuid(2))
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  jobId             String
  job               Job @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidateId       String
  candidate         Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  status            String    @default("applied")
  interviewDates    DateTime[]
  notes             String?

  @@unique([jobId, candidateId])
  @@index([jobId])
  @@index([candidateId])
}

model CalendarEvent {
  id                String    @id @default(cuid(2))
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  title             String
  description       String?   @db.Text
  startTime         DateTime
  endTime           DateTime
  location          String?
  meetingLink       String?
  type              String    @default("interview")
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  attendeeIds       String[]
  jobCandidateId    String?

  @@index([organizationId])
}

model Task {
  id                String    @id @default(cuid(2))
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  text              String
  icon              String
  completed         Boolean   @default(false)
  dueDate           DateTime?
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}
```

---

## Data Flow: Server to Client

The data flow follows this pattern:

1. **Server** exposes data via TanStack Start server routes (REST) or server functions (RPC)
2. **Collections** fetch data via their `queryFn` when components mount or refetch
3. **Hooks** query collections using `useLiveQuery` and transform data to view models
4. **Components** receive view models and render UI
5. **Mutations** update collections optimistically, which sync to server and update UI reactively

TanStack Start provides two patterns for server data access:

### Option 1: Server Routes (REST API)

I use server routes when I need standard REST endpoints that can be consumed by any client.

```typescript
// src/routes/api/jobs.ts
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { prisma } from '~/utils/database.server'

export const Route = createFileRoute('/api/jobs')({
  server: {
    handlers: {
      GET: async () => {
        const jobs = await prisma.job.findMany({
          include: { client: true },
        })
        return json(jobs)
      },
      POST: async ({ request }) => {
        const data = await request.json()
        const job = await prisma.job.create({ data })
        return json(job, { status: 201 })
      },
    },
  },
})

// src/routes/api/jobs/$id.ts - Dynamic route
export const Route = createFileRoute('/api/jobs/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const job = await prisma.job.findUnique({
          where: { id: params.id },
        })
        if (!job) return new Response('Not found', { status: 404 })
        return json(job)
      },
      PUT: async ({ params, request }) => {
        const data = await request.json()
        const job = await prisma.job.update({
          where: { id: params.id },
          data,
        })
        return json(job)
      },
      DELETE: async ({ params }) => {
        await prisma.job.delete({ where: { id: params.id } })
        return json({ success: true })
      },
    },
  },
})
```

### Option 2: Server Functions (Type-Safe RPC)

I use server functions when I want end-to-end type safety and validation with Zod schemas.

```typescript
// src/server/jobs.ts
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '~/utils/database.server'
import { z } from 'zod'

export const getJobs = createServerFn().handler(async () => {
  return prisma.job.findMany({ include: { client: true } })
})

const CreateJobSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  location: z.string(),
  total: z.number().int().min(0),
  organizationId: z.string(),
  clientId: z.string(),
})

export const createJob = createServerFn({ method: 'POST' })
  .inputValidator(CreateJobSchema)
  .handler(async ({ data }) => {
    // data is typed and validated
    return prisma.job.create({ data })
  })

// Usage in component
import { useServerFn } from '@tanstack/react-start'

function JobForm() {
  const createJobFn = useServerFn(createJob)
  
  const handleSubmit = async (data: z.infer<typeof CreateJobSchema>) => {
    const job = await createJobFn({ data })
    console.log('Created:', job.id)
  }
}
```

### Choosing Between Server Routes and Server Functions

| Use Server Routes (REST) when: | Use Server Functions (RPC) when: |
|--------------------------------|-----------------------------------|
| Building a public API | I want end-to-end type safety |
| Multiple clients (web, mobile, etc.) | Input validation with Zod schemas |
| Standard HTTP semantics needed | Simpler developer experience |
| Caching at HTTP layer | Direct function calls feel more natural |

**For this feature**: I use **Server Routes** because TanStack DB collections work seamlessly with REST endpoints via `fetch()`.

### Client: Collections Load Data Automatically

Collections call their `queryFn` to fetch from either REST endpoints or server functions. No manual initialization or sync needed—TanStack DB handles everything reactively.

---

## Implementation: Layer by Layer

I implement the feature in three distinct layers, each with clear responsibilities and boundaries.

### 1. Data Layer: TanStack DB Collections

**Purpose**: Reactive data management with automatic synchronization.

TanStack DB collections load data via `queryFn` and handle CRUD operations with `onInsert`, `onUpdate`, `onDelete` handlers. Collections automatically refetch when needed and provide reactive updates to components.

**Key concepts**:
- Collections are query-backed (load via `queryFn`)
- Mutations are optimistic by default (instant UI updates)
- Live queries automatically re-run when collection data changes
- No manual sync or state management needed

#### Define Query-Backed Collections

```typescript
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import type { Job, Client, Task } from '@prisma/client'

// Jobs collection with full CRUD
export const jobsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs')
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified } = transaction.mutations[0]
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modified),
      })
    },
    onUpdate: async ({ transaction }) => {
      const { original, modified } = transaction.mutations[0]
      await fetch(`/api/jobs/${original.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modified),
      })
    },
    onDelete: async ({ transaction }) => {
      const { original } = transaction.mutations[0]
      await fetch(`/api/jobs/${original.id}`, { method: 'DELETE' })
    },
  })
)

// Clients collection
export const clientsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    },
    getKey: (item) => item.id,
  })
)

// Tasks collection
export const tasksCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json()
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0]
      await fetch(`/api/tasks/${original.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
    },
  })
)

// Calendar events collection
export const calendarEventsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const res = await fetch('/api/calendar-events')
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
    getKey: (item) => item.id,
  })
)
```

---

### 2. Domain/Service Layer: Custom Hooks with Data Transformation

**Purpose**: Transform raw database data into UI-oriented view models.

This layer acts as a translation layer between the data layer (Prisma types) and the UI layer (view models). It contains:
- View model type definitions
- Pure transformation functions
- Custom hooks that query collections and return view models

**Benefits**:
- Components don't depend on database schema
- Easy to change database without breaking UI
- View models can include computed/derived values
- Pure functions are easy to test

#### View Model Types

View models decouple UI from database types—components receive exactly what they need, nothing more.

```typescript
export interface VacancyViewModel {
  id: string
  title: string
  location: string
  total: number
  hired: number
  progressPercent: number // derived
}

export interface ClientSnapshotViewModel {
  name: string
  hired: number
  openRoles: number
}

export interface TaskViewModel {
  id: string
  text: string
  icon: string
}

export interface CalendarEventViewModel {
  id: string
  title: string
  start: Date
  end: Date
  type: 'interview' | 'sync' | 'review'
}
```

#### Pure Transformation Functions

Pure functions transform database types to view models. Easy to test, no side effects.

```typescript
import type { Job } from '@prisma/client'
import type { VacancyViewModel } from './view-models'

const calculateProgress = (hired: number, total: number): number =>
  total > 0 ? Math.round((hired / total) * 100) : 0

export const toVacancyViewModel = (job: Job): VacancyViewModel => ({
  id: job.id,
  title: job.title,
  location: job.location,
  total: job.total,
  hired: job.hired,
  progressPercent: calculateProgress(job.hired, job.total),
})
```

#### Custom Hook: useJobsAndClients

```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'
import { jobsCollection, clientsCollection, tasksCollection, calendarEventsCollection } from './collections'
import * as transformers from './transformers'
import type { JobsAndClientsViewModel } from './view-models'

export function useJobsAndClients(organizationId: string): JobsAndClientsViewModel {
  // Live queries automatically update when collection data changes
  const { data: jobs = [] } = useLiveQuery((q) =>
    q.from({ job: jobsCollection })
     .where(({ job }) => eq(job.organizationId, organizationId))
  )

  const { data: clients = [] } = useLiveQuery((q) =>
    q.from({ client: clientsCollection })
     .where(({ client }) => eq(client.organizationId, organizationId))
  )

  const { data: events = [] } = useLiveQuery((q) =>
    q.from({ event: calendarEventsCollection })
     .where(({ event }) => eq(event.organizationId, organizationId))
     .orderBy(({ event }) => event.startTime, 'asc')
  )

  const { data: tasks = [] } = useLiveQuery((q) =>
    q.from({ task: tasksCollection })
     .where(({ task }) => eq(task.organizationId, organizationId))
     .where(({ task }) => eq(task.completed, false))
  )

  // Transform to view models
  const vacancies = jobs.map(transformers.toVacancyViewModel)
  const clientSnapshots = clients.map((client) => ({
    name: client.name,
    hired: client.totalHired,
    openRoles: jobs.filter((j) => j.clientId === client.id).length,
  }))
  const taskViewModels = tasks.map((t) => ({ id: t.id, text: t.text, icon: t.icon }))
  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startTime,
    end: e.endTime,
    type: e.type,
  }))

  return { vacancies, clients: clientSnapshots, tasks: taskViewModels, events: calendarEvents }
}
```

#### Optimistic Mutations

Collection methods are optimistic by default—UI updates instantly, then syncs to server.

```typescript
// Toggle task completion (instant UI feedback)
tasksCollection.update('task-id', (draft) => {
  draft.completed = true
})

// Insert a new job
jobsCollection.insert({
  id: crypto.randomUUID(),
  title: 'Senior Frontend Engineer',
  description: 'React + TypeScript',
  location: 'Remote',
  total: 3,
  hired: 0,
  organizationId: 'org-1',
  clientId: 'client-1',
})

// Delete a job
jobsCollection.delete('job-id')

// Disable optimistic updates when server must confirm first
const tx = jobsCollection.insert(newJob, { optimistic: false })
await tx.isPersisted.promise // Wait for server confirmation
```

---

### 3. UI Layer: Presentational Components

**Purpose**: Render UI based on view models, with no knowledge of data sources.

Components in this layer:
- Receive view models as props
- Have no knowledge of TanStack DB, Prisma, or server APIs
- Are pure presentational components (easy to test and reuse)
- Can be used in Storybook or other design tools

#### Route Component (TanStack Start)

TanStack Start routes can use loaders for SSR data fetching, or rely entirely on client-side TanStack DB collections. For this feature, I use client-side collections for reactive updates.

```typescript
// src/routes/organizations/$organizationSlug/jobs-and-clients.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useJobsAndClients } from '~/features/jobs/hooks/use-jobs-and-clients'
import {
  ClientSnapshot,
  CurrentVacancies,
  LiveCalendar,
  Agenda,
} from '~/features/jobs/components'

export const Route = createFileRoute('/organizations/$organizationSlug/jobs-and-clients')({
  // Optional: SSR loader for initial data
  loader: async ({ params }) => {
    // Could fetch initial data here for SSR
    // But I'm using TanStack DB collections instead
    return { organizationSlug: params.organizationSlug }
  },
  component: JobsAndClientsPage,
})

function JobsAndClientsPage() {
  const { organizationSlug } = Route.useParams()
  // TanStack DB collections handle all data fetching reactively
  const { vacancies, clients, tasks, events } = useJobsAndClients(organizationSlug)

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 lg:p-6">
      <div className="grid gap-5 lg:grid-cols-3">
        <ClientSnapshot clients={clients} />
        <CurrentVacancies vacancies={vacancies} />
        <Agenda tasks={tasks} />
      </div>
      <LiveCalendar events={events} />
    </div>
  )
}
```

---

## Key Patterns & Best Practices

This section covers essential patterns for building maintainable, testable features with TanStack Start and TanStack DB.

### 1. Decoupling: View Models as Contracts

View models act as contracts between the domain layer and UI layer. I ensure components never receive Prisma types directly.

Before:
```typescript
const ClientSnapshot = ({ clients }: { clients: PrismaClient[] }) => (
  <div>{clients.map(c => <span key={c.id}>{c.name}</span>)}</div>
);
```

After:
```typescript
type ClientSnapshotProps = { clients: ClientSnapshotViewModel[] };
const ClientSnapshot = ({ clients }: ClientSnapshotProps) => (
  <div>{clients.map(c => <span key={c.id}>{c.name}</span>)}</div>
);
```

### 2. Pure Transformation Functions

Keep transformations pure and testable:

```typescript
export const calculateProgress = (hired: number, total: number): number =>
  total > 0 ? Math.round((hired / total) * 100) : 0;

describe('calculateProgress', () => {
  it('returns 50 for 5 hired out of 10', () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });
});
```

### 3. Functional Pipelines for Data Processing

```typescript
const vacancies = jobs
  .filter(job => !job.archived)
  .map(transformers.toVacancyViewModel)
  .sort((a, b) => b.progressPercent - a.progressPercent);
```

### 4. Real-Time Reactivity with TanStack DB

Live queries automatically re-run when underlying collection data changes.

```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { eq, gt, and } from '@tanstack/db'

function ActiveJobs({ organizationId }: { organizationId: string }) {
  const { data: jobs, isLoading } = useLiveQuery((q) =>
    q.from({ job: jobsCollection })
     .where(({ job }) => eq(job.organizationId, organizationId))
     .orderBy(({ job }) => job.createdAt, 'desc')
  )

  if (isLoading) return <div>Loading...</div>
  return <ul>{jobs.map(j => <li key={j.id}>{j.title}</li>)}</ul>
}
```

#### Derived Live Query Collections

Create reusable materialized views from existing collections. These are useful for frequently-used queries.

```typescript
import { createLiveQueryCollection, eq } from '@tanstack/db'

export const openVacancies = createLiveQueryCollection({
  startSync: true,
  query: (q) =>
    q.from({ job: jobsCollection })
     .where(({ job }) => eq(job.hired, 0))
     .select(({ job }) => ({
       id: job.id,
       clientId: job.clientId,
       title: job.title,
       total: job.total,
     })),
})

// Use in components
function OpenVacanciesList() {
  const { data } = useLiveQuery(openVacancies)
  return <ul>{data.map(v => <li key={v.id}>{v.title}</li>)}</ul>
}
```

### 5. Error Handling in Collections

Handle errors gracefully in collection handlers:

```typescript
onUpdate: async ({ transaction }) => {
  try {
    const { original, modified } = transaction.mutations[0]
    const res = await fetch(`/api/jobs/${original.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modified),
    })
    if (!res.ok) {
      throw new Error(`Update failed: ${res.statusText}`)
    }
  } catch (error) {
    // TanStack DB will automatically rollback optimistic update
    console.error('Failed to update job:', error)
    throw error // Re-throw to trigger rollback
  }
}
```

### 6. Filtering and Joins in Live Queries

Use TanStack DB's query API for complex filtering and joins:

```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { eq, and, or, gt } from '@tanstack/db'

function ActiveJobsForClient({ clientId, organizationId }: Props) {
  const { data: jobs } = useLiveQuery((q) =>
    q.from({ job: jobsCollection })
     .where(({ job }) =>
       and(
         eq(job.clientId, clientId),
         eq(job.organizationId, organizationId),
         or(
           eq(job.hired, 0),
           gt(job.hired, job.total)
         )
       )
     )
     .orderBy(({ job }) => job.createdAt, 'desc')
  )
  
  return <ul>{jobs.map(j => <li key={j.id}>{j.title}</li>)}</ul>
}
```

### 7. Testing Patterns

Test transformation functions in isolation:

```typescript
// transformers.test.ts
import { describe, it, expect } from 'vitest'
import { toVacancyViewModel } from './transformers'
import type { Job } from '@prisma/client'

describe('toVacancyViewModel', () => {
  it('calculates progress correctly', () => {
    const job: Job = {
      id: '1',
      title: 'Engineer',
      location: 'Remote',
      total: 10,
      hired: 5,
      // ... other fields
    } as Job
    
    const viewModel = toVacancyViewModel(job)
    expect(viewModel.progressPercent).toBe(50)
  })
})
```

### 8. Type Safety with View Models

Use TypeScript to enforce view model contracts:

```typescript
// ✅ Good: Component receives view model
function VacancyCard({ vacancy }: { vacancy: VacancyViewModel }) {
  return <div>{vacancy.title} - {vacancy.progressPercent}%</div>
}

// ❌ Bad: Component receives Prisma type
function VacancyCard({ job }: { job: Job }) {
  // Tightly coupled to database schema
  return <div>{job.title}</div>
}
```

---

## Quick Reference

### Common Patterns

#### Create a Collection
```typescript
export const myCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['my-data'],
    queryFn: async () => {
      const res = await fetch('/api/my-data')
      return res.json()
    },
    getKey: (item) => item.id,
  })
)
```

#### Query Data in a Hook
```typescript
const { data = [] } = useLiveQuery((q) =>
  q.from({ item: myCollection })
   .where(({ item }) => eq(item.status, 'active'))
)
```

#### Update Data Optimistically
```typescript
myCollection.update('item-id', (draft) => {
  draft.status = 'completed'
})
```

#### Create a Server Route
```typescript
export const Route = createFileRoute('/api/resource')({
  server: {
    handlers: {
      GET: async () => json(await prisma.resource.findMany()),
      POST: async ({ request }) => {
        const data = await request.json()
        return json(await prisma.resource.create({ data }), { status: 201 })
      },
    },
  },
})
```

#### Create a Server Function
```typescript
export const getResource = createServerFn().handler(async () => {
  return prisma.resource.findMany()
})
```

### File Locations

- **Collections**: `src/features/organizations/jobs-and-clients/data/collections.ts`
- **View Models**: `src/features/organizations/jobs-and-clients/data/view-models.ts`
- **Transformers**: `src/features/organizations/jobs-and-clients/data/transformers.ts`
- **Hooks**: `src/features/organizations/jobs-and-clients/hooks/use-jobs-and-clients.ts`
- **Components**: `src/features/organizations/jobs-and-clients/components/`
- **Server Routes**: `src/routes/api+/`
- **Server Functions**: `src/server/`

### Key Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **View Models as Contracts**: UI never depends on database types
3. **Pure Functions**: Transformations are testable and predictable
4. **Reactive by Default**: Live queries update UI automatically
5. **Optimistic Updates**: Instant feedback with automatic rollback
6. **Type Safety**: End-to-end TypeScript from database to UI
