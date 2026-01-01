/**
 * Display components for Jobs and Clients feature
 */

import { BellIcon, ClockIcon } from "lucide-react";
import { useSubmit } from "react-router";

import type {
  AgendaItem,
  CalendarEvent,
  UrgentFunnelUpdate,
} from "./jobs-and-clients-constants";
import { jobsAndClientsIntents } from "./jobs-and-clients-constants";
import {
  formatTime12Hour,
  formatTimeRange,
  isReminderSentRecently,
} from "./jobs-and-clients-helpers";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Spinner } from "~/components/ui/spinner";

export type UrgentFunnelUpdateItemProps = {
  update: UrgentFunnelUpdate;
  isSubmitting?: boolean;
};

export function UrgentFunnelUpdateItem({
  update,
  isSubmitting = false,
}: UrgentFunnelUpdateItemProps) {
  const reminderSentRecently = isReminderSentRecently(update.reminderSentAt);
  const showReminderSent = reminderSentRecently;
  const submit = useSubmit();

  const handleSendReminder = () => {
    if (showReminderSent || isSubmitting) return;

    const formData = new FormData();
    formData.set("intent", jobsAndClientsIntents.sendReminder);
    formData.set("updateId", update.id);
    submit(formData, { method: "post" });
  };

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-start gap-3">
        <BellIcon className="mt-0.5 size-5 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <p className="font-medium">
            Offer Pending for {update.candidateName}
          </p>
          <p className="text-sm text-muted-foreground">{update.message}</p>
          <div className="flex items-center gap-2 pt-2">
            <Badge className="capitalize" variant="secondary">
              {update.urgency}
            </Badge>
            <Button
              disabled={showReminderSent || isSubmitting}
              onClick={handleSendReminder}
              size="sm"
              variant="outline"
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Sending...
                </>
              ) : showReminderSent ? (
                "Reminder Sent"
              ) : (
                "Send Reminder"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type DailyAgendaItemProps = {
  item: AgendaItem;
  isSubmitting?: boolean;
  submittingItemId?: string | null;
  disabled?: boolean;
  handleCheckedChange: (itemId: string, checked: boolean) => void;
};

export function DailyAgendaItem({
  item,
  isSubmitting = false,
  submittingItemId = null,
  disabled = false,
  handleCheckedChange,
}: DailyAgendaItemProps) {
  const isCompleted = item.status === "completed";
  const isItemSubmitting = isSubmitting && submittingItemId === item.id;

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={isCompleted}
        className="mt-0.5"
        disabled={disabled || isItemSubmitting}
        onCheckedChange={(checked) =>
          handleCheckedChange(
            item.id,
            typeof checked === "boolean" ? checked : false,
          )
        }
      />
      <div className="flex-1">
        <p
          className={`text-sm ${isCompleted ? "line-through text-muted-foreground" : ""}`}
        >
          {item.title}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="size-3" />
          <span>{formatTime12Hour(new Date(item.scheduledTime))}</span>
          {isItemSubmitting && (
            <>
              <Spinner className="ml-2 size-3" />
              <span className="text-xs">Updating...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export type DailyAgendaProps = {
  items: AgendaItem[];
  date: Date;
  isSubmitting?: boolean;
  submittingItemId?: string | null;
  disabled?: boolean;
  handleCheckedChange: (itemId: string, checked: boolean) => void;
};

export function DailyAgenda({
  items,
  isSubmitting = false,
  submittingItemId = null,
  disabled = false,
  handleCheckedChange,
}: DailyAgendaProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <DailyAgendaItem
          disabled={disabled}
          handleCheckedChange={handleCheckedChange}
          isSubmitting={isSubmitting}
          item={item}
          key={item.id}
          submittingItemId={submittingItemId}
        />
      ))}
    </div>
  );
}

export type CalendarEventItemProps = {
  event: CalendarEvent;
  onClick?: () => void;
};

export function CalendarEventItem({ event, onClick }: CalendarEventItemProps) {
  return (
    <button
      className="cursor-pointer rounded-lg border bg-primary/5 p-2 transition-colors hover:bg-primary/10"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
      type="button"
    >
      <p className="text-sm font-medium">{event.title}</p>
      <p className="text-xs text-muted-foreground">
        {formatTimeRange(new Date(event.startTime), new Date(event.endTime))}
      </p>
    </button>
  );
}
