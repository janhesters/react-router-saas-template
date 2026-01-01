/**
 * Daily Agenda Section Component
 *
 * Displays the daily agenda with top 2 priority items and a modal for all items
 */

import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigation, useSubmit } from "react-router";

import { DailyAgenda, DailyAgendaItem } from "./jobs-and-clients-components";
import type { AgendaItem } from "./jobs-and-clients-constants";
import { jobsAndClientsIntents } from "./jobs-and-clients-constants";
import {
  formatAgendaDate,
  sortAgendaItemsByTime,
} from "./jobs-and-clients-helpers";
import type { Route } from ".react-router/types/app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/+types/jobs-and-clients";
import { Button } from "~/components/ui/button";
import { SectionWrap } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type DailyAgendaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AgendaItem[];
  date: Date;
  isSubmitting?: boolean;
  submittingItemId?: string | null;
  disabled?: boolean;
  handleCheckedChange: (itemId: string, checked: boolean) => void;
};

function DailyAgendaModal({
  open,
  onOpenChange,
  items,
  isSubmitting = false,
  submittingItemId = null,
  disabled = false,
  handleCheckedChange,
}: DailyAgendaModalProps) {
  const sortedItems = sortAgendaItemsByTime(items);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClockIcon className="size-5" />
            Daily Agenda
          </DialogTitle>
          <DialogDescription>
            All agenda items for this day. Check off items as you complete them.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {sortedItems.length > 0 ? (
            sortedItems.map((item) => (
              <DailyAgendaItem
                disabled={disabled}
                handleCheckedChange={handleCheckedChange}
                isSubmitting={isSubmitting}
                item={item}
                key={item.id}
                submittingItemId={submittingItemId}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No agenda items for this date.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type DailyAgendaSectionProps = {
  dailyAgenda: AgendaItem[];
  agendaDate: Date;
  actionData?: Route.ComponentProps["actionData"] | null;
};

export function DailyAgendaSection({
  dailyAgenda,
  agendaDate,
  actionData,
}: DailyAgendaSectionProps) {
  const navigation = useNavigation();
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [displayedAgendaItems, setDisplayedAgendaItems] =
    useState<AgendaItem[]>(dailyAgenda);
  const [topTwo, setTwo] = useState<AgendaItem[]>([]);
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<string, boolean>
  >(new Map());
  const submit = useSubmit();

  // Check if we're submitting an agenda toggle
  const isSubmitting = navigation.state === "submitting";
  const submittingItemId = navigation.formData?.get("itemId") as string | null;
  const isSubmittingAgendaToggle = isSubmitting && submittingItemId !== null;

  const handleCheckedChange = (itemId: string, checked: boolean) => {
    if (isSubmitting) return;

    const formData = new FormData();
    formData.set("intent", jobsAndClientsIntents.toggleAgendaItem);
    formData.set("itemId", itemId);
    formData.set("newStatus", checked ? "completed" : "pending");

    setDisplayedAgendaItems(() => {
      const newItems = [...dailyAgenda].map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            status: checked ? "completed" : "pending",
          } satisfies AgendaItem;
        }
        return item;
      });
      return newItems;
    });

    setOptimisticUpdates(() => {
      const next = new Map<string, boolean>();
      next.set(itemId, checked);
      return next;
    });

    submit(formData, { method: "post" });
  };

  useEffect(() => {
    const shouldCalibrate =
      navigation.state === "idle" &&
      ((actionData &&
        typeof actionData === "object" &&
        "dailyAgenda" in actionData) ||
        !actionData);

    if (shouldCalibrate) {
      const newTopTwo = [...dailyAgenda]
        .filter((item) => item.status === "pending")
        .slice(0, 2)
        .map((item) => {
          const optimisticStatus = optimisticUpdates.get(item.id);
          if (optimisticStatus) {
            return {
              ...item,
              status: optimisticStatus ? "completed" : "pending",
            } satisfies AgendaItem;
          }
          return item;
        });
      setTwo(newTopTwo);
    }
  }, [navigation.state, actionData, dailyAgenda, optimisticUpdates]);

  return (
    <>
      <SectionWrap
        heading={`Daily Agenda // ${formatAgendaDate(agendaDate)}`}
        headingExtra={
          displayedAgendaItems.length > 2 ? (
            <Button
              onClick={() => setIsAgendaModalOpen(true)}
              size="sm"
              variant="ghost"
            >
              See All
            </Button>
          ) : undefined
        }
        icon={ClockIcon}
      >
        {topTwo.length > 0 ? (
          <DailyAgenda
            date={agendaDate}
            disabled={isSubmittingAgendaToggle}
            handleCheckedChange={handleCheckedChange}
            isSubmitting={isSubmittingAgendaToggle}
            items={topTwo}
            submittingItemId={submittingItemId}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No agenda items for this date.
          </p>
        )}
      </SectionWrap>

      <DailyAgendaModal
        date={agendaDate}
        disabled={isSubmittingAgendaToggle}
        handleCheckedChange={handleCheckedChange}
        isSubmitting={isSubmittingAgendaToggle}
        items={displayedAgendaItems}
        onOpenChange={setIsAgendaModalOpen}
        open={isAgendaModalOpen}
        submittingItemId={submittingItemId}
      />
    </>
  );
}
