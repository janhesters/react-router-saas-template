export type CalendarEvent = {
  title: string;
  start: number;
  end: number;
  displayStart: string;
  displayEnd: string;
};

export type CalendarConfig = {
  startHour: number;
  endHour: number;
};

export function getCalendarEventsData(): CalendarEvent[] {
  // Dummy data - in production, this would come from database
  return [
    {
      title: "AI Candidate Screening",
      start: 9,
      end: 10,
      displayStart: "09:00 AM",
      displayEnd: "10:00 AM",
    },
    {
      title: "Team Sync: Q4 Agentic Features",
      start: 10.5,
      end: 11.5,
      displayStart: "10:30 AM",
      displayEnd: "11:30 AM",
    },
  ];
}

export function getCalendarConfigData(): CalendarConfig {
  return {
    startHour: 9,
    endHour: 17, // 5 PM
  };
}

