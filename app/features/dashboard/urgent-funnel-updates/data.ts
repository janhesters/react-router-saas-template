export type UrgentFunnelUpdate = {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
};

export function getUrgentFunnelUpdatesData(): UrgentFunnelUpdate[] {
  // Dummy data - in production, this would come from database
  return [
    {
      title: "Offer Pending for Sarah Miller",
      description:
        "Awaiting offer acceptance for the Senior Product Manager role. Deadline: EOD.",
      priority: "High",
    },
  ];
}

