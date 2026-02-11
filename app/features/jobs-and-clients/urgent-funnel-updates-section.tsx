/**
 * Urgent Funnel Updates Section Component
 *
 * Displays urgent funnel updates with the first item and a modal for all items
 */

import { useMemo, useState } from "react";
import { useNavigation } from "react-router";

import { UrgentFunnelUpdateItem } from "./jobs-and-clients-components";
import type { UrgentFunnelUpdate } from "./jobs-and-clients-constants";
import { sortFunnelUpdatesByUrgency } from "./jobs-and-clients-helpers";
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

type UrgentFunnelUpdatesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updates: UrgentFunnelUpdate[];
  isSubmitting?: boolean;
  submittingUpdateId?: string | null;
};

function UrgentFunnelUpdatesModal({
  open,
  onOpenChange,
  updates,
  isSubmitting = false,
  submittingUpdateId = null,
}: UrgentFunnelUpdatesModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>All Urgent Funnel Updates</DialogTitle>
          <DialogDescription>
            View and manage all pending funnel updates
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {updates.length > 0 ? (
            updates.map((update) => (
              <UrgentFunnelUpdateItem
                isSubmitting={isSubmitting && submittingUpdateId === update.id}
                key={update.id}
                update={update}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No urgent updates at this time.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type UrgentFunnelUpdatesSectionProps = {
  urgentFunnelUpdates: UrgentFunnelUpdate[];
  actionData?: Route.ComponentProps["actionData"] | null;
};

export function UrgentFunnelUpdatesSection({
  urgentFunnelUpdates,
  actionData,
}: UrgentFunnelUpdatesSectionProps) {
  const navigation = useNavigation();
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);

  // Use action data if available (after sending reminder), otherwise use loader data
  // Parse dates from action data (they come as ISO strings)
  const { sortedUpdates, firstUpdate, hasMoreUpdates } = useMemo(() => {
    const currentUpdates =
      actionData &&
      typeof actionData === "object" &&
      "urgentFunnelUpdates" in actionData &&
      Array.isArray(actionData.urgentFunnelUpdates)
        ? actionData.urgentFunnelUpdates
        : urgentFunnelUpdates;

    // Process data - sort by urgency
    const sortedUpdates = sortFunnelUpdatesByUrgency(currentUpdates);

    // Show only the first update in the section
    const firstUpdate = sortedUpdates[0];
    const hasMoreUpdates = sortedUpdates.length > 1;

    return { currentUpdates, firstUpdate, hasMoreUpdates, sortedUpdates };
  }, [urgentFunnelUpdates, actionData]);

  // Check if we're submitting a reminder
  const isSubmitting = navigation.state === "submitting";
  const submittingUpdateId = navigation.formData?.get("updateId") as
    | string
    | null;
  const isSubmittingReminder = isSubmitting && submittingUpdateId !== null;

  return (
    <>
      <SectionWrap
        heading="Urgent Funnel Updates"
        headingExtra={
          hasMoreUpdates ? (
            <Button
              onClick={() => setIsUpdatesModalOpen(true)}
              size="sm"
              variant="ghost"
            >
              See All
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-2">
          {firstUpdate ? (
            <UrgentFunnelUpdateItem
              isSubmitting={
                isSubmittingReminder && submittingUpdateId === firstUpdate.id
              }
              update={firstUpdate}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No urgent updates at this time.
            </p>
          )}
        </div>
      </SectionWrap>

      <UrgentFunnelUpdatesModal
        isSubmitting={isSubmittingReminder}
        onOpenChange={setIsUpdatesModalOpen}
        open={isUpdatesModalOpen}
        submittingUpdateId={submittingUpdateId}
        updates={sortedUpdates}
      />
    </>
  );
}
