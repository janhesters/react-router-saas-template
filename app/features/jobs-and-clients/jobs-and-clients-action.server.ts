/**
 * Server actions for Jobs and Clients feature
 */

import { parseISO } from "date-fns";
import { data } from "react-router";

import { jobsAndClientsActionSchema } from "./jobs-and-clients-action-schemas";
import type {
  AgendaItem,
  CalendarEvent,
  UrgentFunnelUpdate,
} from "./jobs-and-clients-constants";
import { jobsAndClientsIntents } from "./jobs-and-clients-constants";
import { createMockJobsAndClientsData } from "./jobs-and-clients-mock-data";
import type { Route } from ".react-router/types/app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/+types/jobs-and-clients";
import { validateFormData } from "~/utils/validate-form-data.server";

/**
 * Updates the reminderSentAt field for a specific update
 */
function updateReminderSentAt(
  updates: UrgentFunnelUpdate[],
  updateId: string,
): UrgentFunnelUpdate[] {
  return updates.map((update) => {
    if (update.id === updateId) {
      return {
        ...update,
        reminderSentAt: new Date().toISOString(),
      };
    }
    return update;
  });
}

/**
 * Updates the status of a specific agenda item
 */
function updateAgendaItemStatus(
  items: AgendaItem[],
  itemId: string,
  newStatus: "pending" | "completed",
): AgendaItem[] {
  return items.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        status: newStatus,
      };
    }
    return item;
  });
}

export async function jobsAndClientsAction(args: Route.ActionArgs) {
  const result = await validateFormData(
    args.request,
    jobsAndClientsActionSchema,
  );

  if (!result.success) {
    return result.response;
  }

  const body = result.data;
  const calendarDateParam = new URL(args.request.url).searchParams.get(
    "calendar_date",
  );

  // Get current date for calendar
  const today = new Date();
  let calendarDate = today;
  if (calendarDateParam) {
    const parsedDate = parseISO(calendarDateParam);
    if (!Number.isNaN(parsedDate.getTime())) {
      calendarDate = parsedDate;
    }
  }

  // Get current mock data
  const jobsAndClientsData = createMockJobsAndClientsData(calendarDate);

  switch (body.intent) {
    case jobsAndClientsIntents.sendReminder: {
      const { updateId } = body;

      // Update the specific update with reminderSentAt
      const updatedUpdates = updateReminderSentAt(
        jobsAndClientsData.urgentFunnelUpdates,
        updateId,
      );

      // Simulate 1 second delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Return updated data (dates are already ISO strings)
      return data({
        urgentFunnelUpdates: updatedUpdates,
      });
    }

    case jobsAndClientsIntents.toggleAgendaItem: {
      const { itemId, newStatus } = body;

      // Update the specific agenda item status
      const updatedAgenda = updateAgendaItemStatus(
        jobsAndClientsData.dailyAgenda,
        itemId,
        newStatus,
      );

      // Simulate 1 second delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Return updated data (dates are already ISO strings)
      return data({
        dailyAgenda: updatedAgenda,
      });
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

      let updatedEvents: CalendarEvent[];

      if (eventId) {
        // Editing: update one of the two generated events
        updatedEvents = jobsAndClientsData.calendarEvents.map((event) => {
          if (event.id === eventId) {
            return {
              ...event,
              description: description || undefined,
              endTime, // Already ISO string from form
              participants: participants
                ? participants.split(",").map((p) => p.trim())
                : undefined,
              startTime, // Already ISO string from form
              title,
              type,
            };
          }
          return event;
        });
      } else {
        // Adding: add the new event to the two generated events
        const newEvent: CalendarEvent = {
          description: description || undefined,
          endTime, // Already ISO string from form
          id: `event-${Date.now()}`, // Generate unique ID
          participants: participants
            ? participants.split(",").map((p) => p.trim())
            : undefined,
          startTime, // Already ISO string from form
          title,
          type,
        };

        updatedEvents = [...jobsAndClientsData.calendarEvents, newEvent].sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
      }

      // Simulate 1 second delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Return updated data (dates are already ISO strings)
      return data({
        calendarEvents: updatedEvents,
      });
    }
  }
}
