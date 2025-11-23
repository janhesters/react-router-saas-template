import {
  FileTextIcon,
  MessageCircleIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";

import { cn } from "~/lib/utils";

const tasks = [
  {
    icon: VideoIcon,
    id: 1,
    text: "Interview with Ugbah Isioma",
  },
  {
    icon: UsersIcon,
    id: 2,
    text: "Review 4 new backend developer applications",
  },
  {
    icon: MessageCircleIcon,
    id: 3,
    text: "Follow up with Google hiring manager",
  },
  {
    icon: FileTextIcon,
    id: 4,
    text: "Prepare offer draft for ReactSquad",
  },
];

const suggestions = [
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
    text: "3 candidates match Google’s available Product designer role",
  },
  {
    id: 4,
    text: "Amazon pipeline looks slow, consider optimizing",
  },
];

export const Agenda = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "bg-surface squircle-rounded-3xl h-full p-6 text-black dark:text-white",
        className,
      )}
    >
      <h2 className="mb-6 text-lg font-medium">Daily Agenda</h2>

      <div className="mb-8">
        <h3 className="mb-4 text-base font-medium text-black dark:text-white">
          Today&rsquo;s Tasks
        </h3>

        <ul className="space-y-3">
          {tasks.map((task) => (
            <li className="flex items-start gap-3" key={task.id}>
              <task.icon className="mt-0.5 size-4 shrink-0 text-neutral-300 dark:text-neutral-700" />
              <span className="text-sm text-neutral-900 dark:text-gray-200">
                {task.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-4 text-base font-medium text-black dark:text-white">
          AI Suggestions
        </h3>

        <ul className="space-y-3">
          {suggestions.map((suggestion) => (
            <li className="flex items-start gap-3" key={suggestion.id}>
              <SparklesIcon className="mt-0.5 size-4 shrink-0 text-neutral-300 dark:text-neutral-700" />
              <span className="text-sm text-neutral-900 dark:text-gray-200">
                {suggestion.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
