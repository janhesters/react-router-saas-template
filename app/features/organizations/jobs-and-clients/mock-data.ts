import type { CalendarEvent } from "./types";

export const mockUpcomingInterview = {
  attendees: [
    "/images/dp1.png",
    "/images/dp2.png",
    "/images/dp3.png",
    "/images/dp4.png",
    "/images/dp5.png",
  ],
  company: "React Squad",
  date: "10:30am - 11:00am",
  email: "ugbahisioma@gmail.com",
  extraAttendees: 2,
  image: "/images/monarch-image.png",
  meetingLink: "https://meet.google.com/xxx-xxxx-xxx",
  name: "Ugbah Isioma",
  phone: "+234 808 229 2082",
  resumeHighlights: [
    "5+ years of experience in React and TypeScript",
    "Led frontend architecture for 3 major product launches",
    "Expert in state management (Redux, Zustand, Jotai)",
    "Strong background in performance optimization",
  ],
  role: "Senior frontend engineer",
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "Tanstack Ecosystem",
    "TailwindCSS",
    "React Testing Library",
    "GraphQL",
  ],
};

export const mockTasks = [
  {
    icon: "VideoIcon" as const,
    id: 1,
    text: "Interview with Ugbah Isioma",
  },
  {
    icon: "UsersIcon" as const,
    id: 2,
    text: "Review 4 new backend developer applications",
  },
  {
    icon: "MessageCircleIcon" as const,
    id: 3,
    text: "Follow up with Google hiring manager",
  },
  {
    icon: "FileTextIcon" as const,
    id: 4,
    text: "Prepare offer draft for ReactSquad",
  },
];

export const mockSuggestions = [
  {
    id: 1,
    text: "Want to auto-rank 12 new applicants?",
  },
  {
    id: 2,
    text: "Move to next stage",
  },
  {
    id: 3,
    text: "3 candidates match Google's available Product designer role",
  },
  {
    id: 4,
    text: "Amazon pipeline looks slow, consider optimizing",
  },
];

export const mockClients = [
  {
    hired: 20,
    name: "Google",
    openRoles: 4,
  },
  {
    hired: 15,
    name: "Microsoft",
    openRoles: 3,
  },
  {
    hired: 30,
    name: "Amazon",
    openRoles: 5,
  },
  {
    hired: 10,
    name: "Apple",
    openRoles: 2,
  },
];

export const mockVacancies = [
  {
    hired: 0,
    id: 1,
    location: "United states",
    title: "Product Designer",
    total: 5,
  },
  {
    hired: 0,
    id: 2,
    location: "United states",
    title: "Product Designer",
    total: 5,
  },
  {
    hired: 2,
    id: 3,
    location: "Canada",
    title: "UX Researcher",
    total: 3,
  },
  {
    hired: 2,
    id: 3,
    location: "Canada",
    title: "UX Researcher",
    total: 3,
  },
];

export const mockCandidateSources = {
  legend: {
    bottom: "0",
    data: ["Meta", "Amazon", "Google", "Netflix", "ReactSquad", "Others"],
    icon: "roundRect",
    itemGap: 20,
    itemHeight: 12,
    itemWidth: 12,
    left: "center",
    textStyle: {
      color: "#9ca3af", // gray-400
      fontSize: 12,
    },
  },
  series: [
    {
      center: ["50%", "40%"],
      data: [
        { itemStyle: { color: "#0099ff" }, name: "Meta", value: 35 },
        { itemStyle: { color: "#33adff" }, name: "Google", value: 30 },
        { itemStyle: { color: "#66c2ff" }, name: "Amazon", value: 25 },
        { itemStyle: { color: "#80ccff" }, name: "Netflix", value: 20 },
        { itemStyle: { color: "#99d6ff" }, name: "ReactSquad", value: 15 },
        { itemStyle: { color: "#b3e0ff" }, name: "Others", value: 10 },
      ],
      itemStyle: {
        borderRadius: 6,
      },
      label: {
        show: false,
      },
      name: "Candidate Sources",
      radius: ["20%", "60%"],
      roseType: "area",
      type: "pie",
    },
  ],
  tooltip: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
    textStyle: {
      color: "#f3f4f6",
    },
    trigger: "item",
  },
};

export const mockEvents: CalendarEvent[] = [
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
