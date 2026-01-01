# Jobs and Clients Feature

Complete implementation outline for the Jobs and Clients page with types, utilities, hooks, and components.

## Overview

This feature provides a comprehensive dashboard for managing jobs, clients, candidates, and related activities. It includes:

- **Urgent Funnel Updates**: Notifications about pending offers and critical actions
- **Daily Agenda**: Task list for the current day
- **Calendar View**: Hourly calendar with scheduled events
- **Performance Metrics**: Charts showing target achievements
- **Growth Trends**: Charts showing performance over time
- **AI Assistant**: Chat interface with contextual actions

## File Structure

```
app/features/jobs-and-clients/
├── README.md                              # This file
├── IMPLEMENTATION_OUTLINE.md             # Detailed implementation guide
├── jobs-and-clients-constants.ts         # Constants and type definitions
├── jobs-and-clients-helpers.ts           # Helper functions
├── jobs-and-clients-mock-data.ts         # Mock data generators
├── jobs-and-clients-loader.server.ts     # Loader function
├── jobs-and-clients-components.tsx       # Display components
├── jobs-and-clients-integration-example.tsx # Complete integration example
├── use-calendar-navigation.ts             # Calendar navigation hook
├── use-ai-chat.ts                        # AI chat hook
└── use-auto-resize-textarea.ts           # Textarea auto-resize hook
```

## Quick Start

### 1. Add Loader to Route File

```tsx
// In jobs-and-clients.tsx route file
export { jobsAndClientsLoader as loader } from "~/features/jobs-and-clients/jobs-and-clients-loader.server";
```

### 2. Import Required Modules in Component

```tsx
import type { Route } from "./+types/jobs-and-clients";
import { useCalendarNavigation } from "~/features/jobs-and-clients/use-calendar-navigation";
import { useAiChat } from "~/features/jobs-and-clients/use-ai-chat";
import { useAutoResizeTextarea } from "~/features/jobs-and-clients/use-auto-resize-textarea";
import {
  formatAgendaDate,
  formatCalendarDate,
  formatHourIndex,
  getAgendaItemsForDate,
  getEventsByHour,
  sortFunnelUpdatesByUrgency,
} from "~/features/jobs-and-clients/jobs-and-clients-helpers";
import {
  DailyAgenda,
  UrgentFunnelUpdateItem,
  CalendarEventItem,
} from "~/features/jobs-and-clients/jobs-and-clients-components";
```

### 3. Initialize Hooks and Data from Loader

```tsx
export default function JobsAndClientsRoute({ loaderData }: Route.ComponentProps) {
  // Get data from loader (mock data is generated in the loader)
  const {
    urgentFunnelUpdates,
    dailyAgenda,
    calendarEvents,
    chatMessages,
    contextualActions,
  } = loaderData;

  // Calendar navigation
  const { currentDate, goToPreviousDay, goToNextDay, goToToday } = useCalendarNavigation();

  // AI Chat
  const { messages, sendMessage, isLoading } = useAiChat(chatMessages);

  // Textarea auto-resize
  const { handleInput } = useAutoResizeTextarea();

  // Process data for current date
  const sortedUpdates = sortFunnelUpdatesByUrgency(urgentFunnelUpdates);
  const agendaItems = getAgendaItemsForDate(dailyAgenda, currentDate);
  const eventsByHour = getEventsByHour(calendarEvents, currentDate);
  
  // ... rest of component
}
```

### 3. Use in Components

See `jobs-and-clients-integration-example.tsx` for a complete example.

## Key Features

### Calendar Navigation
- Navigate between days with previous/next buttons
- Jump to today with a single click
- Automatically filters events and agenda items for selected date

### AI Chat
- Send and receive messages
- Auto-resizing textarea
- Loading states
- Contextual actions based on conversation

### Data Processing
- Automatic sorting by urgency and deadline
- Date-based filtering
- Time formatting (12-hour format)
- Event grouping by hour

## Types and Constants

All types and constants are defined in `jobs-and-clients-constants.ts`:

- `UrgentFunnelUpdate`: Urgent notifications
- `AgendaItem`: Daily tasks
- `CalendarEvent`: Scheduled events
- `PerformanceMetric`: Metrics for charts
- `GrowthTrend`: Trend data for charts
- `ChatMessage`: Chat messages
- `ContextualAction`: Action buttons

## Helpers

All helper functions are in `jobs-and-clients-helpers.ts`:

### Date/Time Formatting
- `formatCalendarDate()`: "Monday, October 26"
- `formatTime12Hour()`: "09:00 AM"
- `formatTimeRange()`: "09:00 AM - 10:00 AM"
- `formatAgendaDate()`: "2025.04.23"
- `formatHourIndex()`: "12 AM" format

### Data Processing
- `getEventsByHour()`: Groups events by hour
- `getAgendaItemsForDate()`: Filters agenda for date
- `sortFunnelUpdatesByUrgency()`: Sorts by urgency
- `sortAgendaItemsByTime()`: Sorts chronologically

## Hooks

### `useCalendarNavigation`
Manages calendar date state and navigation.

```tsx
const { currentDate, goToPreviousDay, goToNextDay, goToToday, isCurrentDateToday } = useCalendarNavigation();
```

### `useAiChat`
Manages chat messages and sending.

```tsx
const { messages, sendMessage, clearMessages, isLoading } = useAiChat(initialMessages);
```

### `useAutoResizeTextarea`
Provides handler for auto-resizing textarea.

```tsx
const { handleInput } = useAutoResizeTextarea();
<Textarea onInput={handleInput} />
```

## Components

### `UrgentFunnelUpdateItem`
Displays a single urgent update with badge and action button.

### `DailyAgendaItem`
Displays a single agenda item with time.

### `DailyAgenda`
Displays list of agenda items for a date.

### `CalendarEventItem`
Displays a single calendar event.

## Mock Data

Mock data is generated in the loader (`jobs-and-clients-loader.server.ts`), not in components. This follows React Router best practices and makes it easy to swap mock data for real database queries later.

The `createMockJobsAndClientsData()` function is used in the loader to generate sample data for development and testing.

## Data Flow

**Important:** All data comes from the loader, not from components.

1. **Loader** (`jobs-and-clients-loader.server.ts`) generates mock data (or fetches from database)
2. **Component** receives data via `loaderData` prop
3. **Hooks** process and manage the data for UI interactions

This pattern ensures:
- Data is available on initial render (SSR)
- Easy to swap mock data for real queries
- Follows React Router conventions
- Type-safe data flow

## Next Steps

1. **Server Integration**: Update `jobsAndClientsLoader` to fetch real data from the database (replace `createMockJobsAndClientsData()` with actual queries)
2. **API Endpoints**: Create endpoints for:
   - Fetching urgent updates
   - Fetching agenda items
   - Fetching calendar events
   - Sending chat messages
   - Triggering contextual actions
3. **Chart Integration**: Add charting library (e.g., Recharts) for metrics and trends
4. **Real-time Updates**: Add WebSocket support for live updates
5. **Enhanced Features**: Add filtering, search, pagination, etc.

## See Also

- `IMPLEMENTATION_OUTLINE.md` - Detailed implementation guide
- `jobs-and-clients-integration-example.tsx` - Complete integration example
