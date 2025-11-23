export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: "interview" | "sync" | "review";
  attendees?: string[];
  description?: string;
  location?: string;
  meetingLink?: string;
}
