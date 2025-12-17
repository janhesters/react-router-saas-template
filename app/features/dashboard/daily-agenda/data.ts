export type AgendaItem = {
  id: number;
  text: string;
  checked: boolean;
};

export function getDailyAgendaData(): AgendaItem[] {
  // Dummy data - in production, this would come from database
  return [
    {
      id: 1,
      text: "Review AI Candidate Profiles for Senior Software Engineer Role",
      checked: false,
    },
    {
      id: 2,
      text: "Schedule interview with candidate 'Alex Johnson'",
      checked: false,
    },
  ];
}

