export interface FunnelUpdate {
  id: number;
  title: string;
  description: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
}

export interface AgendaItem {
  id: number;
  task: string;
  completed: boolean;
}

export interface CalenderEvent {
  id: number;
  title: string;
  start: string;
  end: string;
}

export type AIMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};
