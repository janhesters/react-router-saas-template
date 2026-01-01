# Jobs and Clients Page - Implementation Outline

This document outlines the complete implementation plan for the Jobs and Clients page, including types, utilities, hooks, and component integration.

## File Structure

```
app/features/jobs-and-clients/
├── jobs-and-clients-constants.ts      # Constants and type definitions
├── jobs-and-clients-helpers.ts         # Helper functions
├── jobs-and-clients-mock-data.ts      # Mock data generators
├── jobs-and-clients-loader.server.ts  # Loader function (returns mock data)
├── use-calendar-navigation.ts         # Calendar navigation hook
├── use-ai-chat.ts                     # AI chat hook
├── use-auto-resize-textarea.ts        # Textarea auto-resize hook
├── jobs-and-clients-components.tsx   # Display components
├── jobs-and-clients-integration-example.tsx # Complete integration example
└── IMPLEMENTATION_OUTLINE.md          # This file
```

## 1. Constants and Type Definitions (`jobs-and-clients-constants.ts`)

### Core Types

- **`UrgentFunnelUpdate`**: Represents urgent notifications about pending offers, interviews, etc.
  - Fields: `id`, `candidateName`, `roleTitle`, `status`, `urgency`, `deadline`, `message`, `organizationId`

- **`AgendaItem`**: Represents daily agenda tasks
  - Fields: `id`, `title`, `scheduledTime`, `status`, `description`, `relatedEntityId`, `relatedEntityType`

- **`CalendarEvent`**: Represents calendar events/interviews
  - Fields: `id`, `title`, `startTime`, `endTime`, `description`, `type`, `participants`, `relatedEntityId`, `relatedEntityType`

- **`PerformanceMetric`**: Represents performance metrics for charts
  - Fields: `id`, `label`, `value`, `target`, `unit`, `period`

- **`GrowthTrend`**: Represents growth trend data for charts
  - Fields: `id`, `metric`, `dataPoints`, `comparison`

- **`ChatMessage`**: Represents AI chat messages
  - Fields: `id`, `role`, `content`, `timestamp`, `metadata`

- **`ContextualAction`**: Represents contextual action buttons
  - Fields: `id`, `label`, `icon`, `action`, `requiresContext`

## 2. Helper Functions (`jobs-and-clients-helpers.ts`)

### Date/Time Formatting
- `formatCalendarDate()`: Formats date as "Monday, October 26"
- `formatTime12Hour()`: Formats time as "09:00 AM"
- `formatTimeRange()`: Formats time range as "09:00 AM - 10:00 AM"
- `formatAgendaDate()`: Formats date as "2025.04.23"
- `formatHourIndex()`: Converts hour index (0-23) to "12 AM" format

### Calendar Utilities
- `getHourIndex()`: Gets hour index from date
- `isEventInHour()`: Checks if event falls within specific hour
- `getEventsByHour()`: Groups events by hour for a date
- `getAgendaItemsForDate()`: Filters agenda items for a specific date
- `sortAgendaItemsByTime()`: Sorts agenda items chronologically

### Data Processing
- `sortFunnelUpdatesByUrgency()`: Sorts updates by urgency level
- `calculateMetricPercentage()`: Calculates percentage for metrics
- `formatPercentage()`: Formats percentage string
- `getGrowthChangeIndicator()`: Gets positive/negative indicator for trends

### Date Manipulation
- `isToday()`: Checks if date is today
- `getStartOfDay()` / `getEndOfDay()`: Gets start/end of day
- `addDays()` / `subtractDays()`: Date arithmetic

## 3. Mock Data (`jobs-and-clients-mock-data.ts`)

### Data Generators
- `createMockUrgentFunnelUpdates()`: Creates sample urgent updates
- `createMockDailyAgenda()`: Creates sample agenda items for a date
- `createMockCalendarEvents()`: Creates sample calendar events
- `createMockPerformanceMetrics()`: Creates sample performance metrics
- `createMockGrowthTrends()`: Creates sample growth trend data
- `createMockChatMessages()`: Creates sample chat messages
- `createMockContextualActions()`: Creates sample contextual actions
- `createMockJobsAndClientsData()`: Creates complete mock dataset

**Note:** These functions are used in the loader, not directly in components.

## 3.5. Loader (`jobs-and-clients-loader.server.ts`)

The loader function returns mock data for development. In production, replace `createMockJobsAndClientsData()` with actual database queries.

**Key Points:**
- Mock data is generated in the loader, not in the component
- The loader returns all data needed by the component
- Easy to swap mock data for real database queries later
- Follows React Router data loading patterns

**Usage in route file:**
```tsx
export { jobsAndClientsLoader as loader } from "~/features/jobs-and-clients/jobs-and-clients-loader.server";
```

## 4. Custom Hooks

### `useCalendarNavigation` (`use-calendar-navigation.ts`)
Manages calendar date navigation state.

**Returns:**
- `currentDate`: Current selected date
- `goToPreviousDay()`: Navigate to previous day
- `goToNextDay()`: Navigate to next day
- `goToToday()`: Jump to today
- `isCurrentDateToday`: Boolean indicating if current date is today

**Usage:**
```tsx
const { currentDate, goToPreviousDay, goToNextDay, goToToday, isCurrentDateToday } = useCalendarNavigation();
```

### `useAiChat` (`use-ai-chat.ts`)
Manages AI chat state and message sending.

**Returns:**
- `messages`: Array of chat messages
- `sendMessage(content)`: Send a new message
- `clearMessages()`: Clear all messages
- `isLoading`: Boolean indicating if message is being sent

**Usage:**
```tsx
const { messages, sendMessage, isLoading } = useAiChat(initialMessages);
```

### `useAutoResizeTextarea` (`use-auto-resize-textarea.ts`)
Provides handler for auto-resizing textarea.

**Returns:**
- `handleInput`: Event handler for textarea input

**Usage:**
```tsx
const { handleInput } = useAutoResizeTextarea();
<Textarea onInput={handleInput} />
```

## 5. Display Components (`jobs-and-clients-components.tsx`)

### `UrgentFunnelUpdateItem`
Displays a single urgent funnel update with badge and action button.

**Props:**
- `update`: UrgentFunnelUpdate
- `onSendReminder?`: Optional callback for send reminder action

### `DailyAgendaItem`
Displays a single agenda item with time.

**Props:**
- `item`: AgendaItem

### `DailyAgenda`
Displays list of agenda items for a date.

**Props:**
- `items`: AgendaItem[]
- `date`: Date

### `CalendarEventItem`
Displays a single calendar event.

**Props:**
- `event`: CalendarEvent

## 6. Integration into Main Component

### Step 1: Add Loader to Route File
```tsx
// In jobs-and-clients.tsx route file
export { jobsAndClientsLoader as loader } from "~/features/jobs-and-clients/jobs-and-clients-loader.server";
```

### Step 2: Import Types, Utilities, and Components
```tsx
import type { Route } from "./+types/jobs-and-clients";
import { useCalendarNavigation } from "~/features/jobs-and-clients/use-calendar-navigation";
import { useAiChat } from "~/features/jobs-and-clients/use-ai-chat";
import { useAutoResizeTextarea } from "~/features/jobs-and-clients/use-auto-resize-textarea";
import {
  formatCalendarDate,
  formatAgendaDate,
  getEventsByHour,
  formatHourIndex,
  getAgendaItemsForDate,
  sortFunnelUpdatesByUrgency,
} from "~/features/jobs-and-clients/jobs-and-clients-helpers";
import {
  UrgentFunnelUpdateItem,
  DailyAgenda,
  CalendarEventItem,
} from "~/features/jobs-and-clients/jobs-and-clients-components";
```

### Step 3: Initialize Data and Hooks
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

### Step 4: Update Urgent Funnel Updates Section
```tsx
<SectionWrap heading="Urgent Funnel Updates">
  <div className="space-y-4">
    {sortedUpdates.map((update) => (
      <UrgentFunnelUpdateItem
        key={update.id}
        update={update}
        onSendReminder={(id) => {
          // Handle send reminder action
          console.log("Send reminder for", id);
        }}
      />
    ))}
  </div>
</SectionWrap>
```

### Step 5: Update Daily Agenda Section
```tsx
<SectionWrap heading={`Daily Agenda // ${formatAgendaDate(currentDate)}`} icon={ClockIcon}>
  <DailyAgenda items={agendaItems} date={currentDate} />
</SectionWrap>
```

### Step 6: Update Calendar Section
```tsx
<SectionWrap
  heading={
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={goToPreviousDay}>
        <ChevronLeftIcon className="size-4" />
      </Button>
      <span>{formatCalendarDate(currentDate)}</span>
      <Button size="sm" variant="ghost" onClick={goToNextDay}>
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  }
  headingExtra={
    <Button size="sm" variant="secondary" onClick={goToToday}>
      Today
    </Button>
  }
>
  <div className="space-y-2">
    {Array.from({ length: 24 }).map((_, hour) => (
      <div key={hour} className="flex items-center gap-4 border-b py-2 last:border-b-0">
        <div className="w-20 text-xs text-muted-foreground">
          {formatHourIndex(hour)}
        </div>
        <div className="flex-1">
          {eventsByHour.get(hour)?.map((event) => (
            <CalendarEventItem key={event.id} event={event} />
          ))}
        </div>
      </div>
    ))}
  </div>
</SectionWrap>
```

### Step 7: Update AI Assistant Section
```tsx
<div className="flex-1 space-y-4 overflow-y-auto">
  {messages.map((message) => (
    <div
      key={message.id}
      className={cn(
        "rounded-lg p-3",
        message.role === "user"
          ? "ml-auto max-w-[80%] bg-primary text-primary-foreground"
          : "bg-muted"
      )}
    >
      <p className="text-sm">{message.content}</p>
    </div>
  ))}
</div>

<div className="mt-4 space-y-4">
  <div className="space-y-2">
    <Textarea
      className="resize-none overflow-auto min-h-[2.5rem] max-h-[7.5rem]"
      onInput={handleInput}
      placeholder="Ask me anything..."
      rows={1}
      disabled={isLoading}
    />
    <Button
      className="w-full"
      size="sm"
      onClick={() => {
        const input = document.querySelector('textarea') as HTMLTextAreaElement;
        if (input?.value) {
          sendMessage(input.value);
          input.value = '';
          input.style.height = 'auto';
        }
      }}
      disabled={isLoading}
    >
      {isLoading ? "Sending..." : "Send"}
    </Button>
  </div>
  {/* Contextual Actions */}
</div>
```

## 7. Future Enhancements

### Server Integration
1. Update loader to fetch real data from database
2. Create API endpoints for:
   - Fetching urgent updates
   - Fetching agenda items
   - Fetching calendar events
   - Sending chat messages
   - Triggering contextual actions

### Real-time Updates
1. Add WebSocket support for live updates
2. Implement optimistic updates for actions
3. Add loading states for async operations

### Chart Integration
1. Integrate charting library (e.g., Recharts, Chart.js)
2. Implement Performance Metrics chart
3. Implement Growth Trends chart

### Enhanced Features
1. Filter and search functionality
2. Pagination for long lists
3. Drag-and-drop for calendar events
4. Keyboard shortcuts
5. Export functionality

## 8. Testing Considerations

### Unit Tests
- Test utility functions with various date inputs
- Test sorting and filtering functions
- Test mock data generators

### Integration Tests
- Test calendar navigation
- Test chat message sending
- Test textarea auto-resize

### Component Tests
- Test display components render correctly
- Test user interactions (buttons, inputs)
- Test loading and error states

## Summary

This implementation provides:
- ✅ Complete type definitions
- ✅ Comprehensive utility functions
- ✅ Mock data generators
- ✅ Custom React hooks for state management
- ✅ Reusable display components
- ✅ Clear integration guide

The code follows the project's patterns and conventions, uses functional programming principles, and is ready for server-side integration when needed.

