import { z } from "zod";

import { jobsAndClientsIntents } from "./jobs-and-clients-constants";

export const sendReminderSchema = z.object({
  intent: z.literal(jobsAndClientsIntents.sendReminder),
  updateId: z.string().min(1),
});

export const toggleAgendaItemSchema = z.object({
  intent: z.literal(jobsAndClientsIntents.toggleAgendaItem),
  itemId: z.string().min(1),
  newStatus: z.enum(["pending", "completed", "cancelled", "deferred"]),
});

export const addOrEditEventSchema = z.object({
  description: z.string().optional(),
  endTime: z.string().min(1),
  eventId: z.string().optional(), // Present when editing
  intent: z.literal(jobsAndClientsIntents.addOrEditEvent),
  participants: z.string().optional(), // Comma-separated string
  startTime: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["interview", "meeting", "screening", "sync", "other"]),
});

export const jobsAndClientsActionSchema = z.discriminatedUnion("intent", [
  sendReminderSchema,
  toggleAgendaItemSchema,
  addOrEditEventSchema,
]);
