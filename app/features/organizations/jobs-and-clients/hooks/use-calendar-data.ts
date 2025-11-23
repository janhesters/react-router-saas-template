import { useEffect, useState } from "react";

import type { CalendarEvent } from "../types";

const mockEvents: CalendarEvent[] = [
  {
    attendees: ["/images/dp1.png", "/images/dp3.png"],
    description:
      "Initial screening for the Senior AI Engineer role. Focus on agentic workflows and LLM integration experience.",
    end: new Date(new Date().setHours(10, 0, 0, 0)),
    id: 1,
    location: "Google Meet",
    meetingLink: "https://meet.google.com/xxx-xxxx-xxx",
    start: new Date(new Date().setHours(9, 0, 0, 0)),
    title: "AI Candidate Screening",
    type: "interview",
  },
  {
    attendees: ["/images/dp2.png", "/images/dp3.png", "/images/dp5.png"],
    description:
      "Weekly sync to discuss progress on Q4 deliverables. Key topics: Multi-agent orchestration and memory systems.",
    end: new Date(new Date().setHours(11, 0, 0, 0)),
    id: 2,
    location: "Zoom",
    meetingLink: "https://zoom.us/j/123456789",
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    title: "Team Sync: Q4 Agentic Features",
    type: "sync",
  },
  {
    attendees: ["/images/monarch-image.png"],
    description: "Reviewing the new dashboard designs with the product team.",
    end: new Date(new Date().setHours(14, 30, 0, 0)),
    id: 3,
    location: "Huddle Room A",
    start: new Date(new Date().setHours(13, 0, 0, 0)),
    title: "Design Review",
    type: "review",
  },
];

export const useCalendarData = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setEvents(mockEvents);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { events, isLoading };
};
