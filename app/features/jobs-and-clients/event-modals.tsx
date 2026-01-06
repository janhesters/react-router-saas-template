/**
 * Event Modals Component
 *
 * Provides modals for viewing and adding/editing calendar events
 */

import { IconPencil } from "@tabler/icons-react";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigation, useSubmit } from "react-router";

import type { CalendarEvent } from "./jobs-and-clients-constants";
import {
  CALENDAR_EVENT_TYPES,
  jobsAndClientsIntents,
} from "./jobs-and-clients-constants";
import { formatTimeRange } from "./jobs-and-clients-helpers";
import type { Route } from ".react-router/types/app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/+types/jobs-and-clients";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";

export type ViewEventModalProps = {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
};

export function ViewEventModal({
  event,
  open,
  onOpenChange,
  onEdit,
}: ViewEventModalProps) {
  const participants = useMemo(
    () =>
      event?.participants?.map((participant) => ({
        id: crypto.randomUUID(),
        participant,
      })) ?? [],
    [event?.participants],
  );

  if (!event) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        {/* Edit button row - positioned next to close button */}
        <div className="absolute top-4 right-16 flex items-center">
          <Button onClick={onEdit} size="sm" variant="ghost">
            <IconPencil className="size-4" />
          </Button>
        </div>

        <DialogHeader className="pt-8">
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>
            {formatTimeRange(
              new Date(event.startTime),
              new Date(event.endTime),
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <div className="mt-1">
              <Badge className="capitalize" variant="secondary">
                {event.type}
              </Badge>
            </div>
          </div>

          {event.description && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <p className="mt-1 text-sm">{event.description}</p>
            </div>
          )}

          {participants.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Participants
              </Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {participants.map(({ id, participant }) => (
                  <Badge key={id} variant="outline">
                    {participant}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {event.relatedEntityType && event.relatedEntityId && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Related {event.relatedEntityType}
              </Label>
              <p className="mt-1 text-sm">{event.relatedEntityId}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type AddEditEventModalProps = {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  actionData?: Route.ComponentProps["actionData"] | null;
};

export function AddEditEventModal({
  event,
  open,
  onOpenChange,
  defaultDate,
  actionData,
}: AddEditEventModalProps) {
  const isEditing = !!event;
  const submit = useSubmit();
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    description: "",
    endTime: "",
    participants: "",
    relatedEntityId: "",
    relatedEntityType: "",
    startTime: "",
    title: "",
    type: "meeting",
  });

  const [errors, setErrors] = useState<{ endTime?: string }>({});
  const wasSubmittingRef = useRef(false);

  // Check if we're submitting the add/edit event form
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === jobsAndClientsIntents.addOrEditEvent;

  // Track submission state
  useEffect(() => {
    if (isSubmitting) {
      wasSubmittingRef.current = true;
    }
  }, [isSubmitting]);

  // Close modal when action data is received after submission
  useEffect(() => {
    if (
      open &&
      wasSubmittingRef.current &&
      navigation.state === "idle" &&
      actionData &&
      typeof actionData === "object" &&
      "calendarEvents" in actionData
    ) {
      wasSubmittingRef.current = false;
      onOpenChange(false);
    }
  }, [open, navigation.state, actionData, onOpenChange]);

  // Reset submission tracking when modal closes
  useEffect(() => {
    if (!open) {
      wasSubmittingRef.current = false;
    }
  }, [open]);

  // Reset form when modal opens/closes or event changes
  useEffect(() => {
    if (open) {
      setFormData({
        description: event?.description || "",
        endTime: event
          ? format(new Date(event.endTime), "yyyy-MM-dd HH:mm")
          : defaultDate
            ? format(new Date(defaultDate), "yyyy-MM-dd HH:mm")
            : "",
        participants: event?.participants?.join(", ") || "",
        relatedEntityId: event?.relatedEntityId || "",
        relatedEntityType: event?.relatedEntityType || "",
        startTime: event
          ? format(new Date(event.startTime), "yyyy-MM-dd HH:mm")
          : defaultDate
            ? format(new Date(defaultDate), "yyyy-MM-dd HH:mm")
            : "",
        title: event?.title || "",
        type: event?.type || "meeting",
      });
      setErrors({});
    }
  }, [open, event, defaultDate]);

  // Validate that end time is after start time
  const validateTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      setErrors({});
      return true;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setErrors({
        endTime: "End time must be after start time",
      });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate time range before submission
    if (!validateTimeRange(formData.startTime, formData.endTime)) {
      return;
    }

    // Convert datetime-local strings to ISO strings
    const startTimeISO = new Date(formData.startTime).toISOString();
    const endTimeISO = new Date(formData.endTime).toISOString();

    // Compile form data and submit
    const formDataToSubmit = new FormData();
    formDataToSubmit.set("intent", jobsAndClientsIntents.addOrEditEvent);
    formDataToSubmit.set("title", formData.title);
    formDataToSubmit.set("type", formData.type);
    formDataToSubmit.set("startTime", startTimeISO);
    formDataToSubmit.set("endTime", endTimeISO);

    if (formData.description) {
      formDataToSubmit.set("description", formData.description);
    }

    if (formData.participants) {
      formDataToSubmit.set("participants", formData.participants);
    }

    // Include eventId when editing
    if (isEditing && event) {
      formDataToSubmit.set("eventId", event.id);
    }

    submit(formDataToSubmit, { method: "post" });
    // Don't close modal here - wait for actionData
  };

  const handleChange = (
    field: string,
    value: string | number | boolean | null,
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Validate time range when startTime or endTime changes
      if (field === "startTime" || field === "endTime") {
        validateTimeRange(updated.startTime ?? "", updated.endTime ?? "");
      }

      return updated;
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the event details below."
              : "Fill in the details to create a new calendar event."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <fieldset className="space-y-4" disabled={isSubmitting}>
            <div className="grid gap-1">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                onChange={(e) => handleChange("title", e.target.value)}
                required
                value={formData.title}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(value) => handleChange("type", value ?? "")}
                  value={formData.type}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALENDAR_EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-fit grid gap-1">
                <Label htmlFor="startTime">
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startTime"
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  required
                  type="datetime-local"
                  value={formData.startTime}
                />
              </div>
              <div className="h-fit grid gap-1">
                <Label htmlFor="endTime">
                  End Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  aria-invalid={!!errors.endTime}
                  id="endTime"
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  required
                  type="datetime-local"
                  value={formData.endTime}
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">{errors.endTime}</p>
                )}
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                value={formData.description}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="participants">Participants</Label>
              <Input
                id="participants"
                onChange={(e) => handleChange("participants", e.target.value)}
                placeholder="Comma-separated list of participants"
                value={formData.participants}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Separate multiple participants with commas
              </p>
            </div>
          </fieldset>

          <DialogFooter className="mt-6">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
