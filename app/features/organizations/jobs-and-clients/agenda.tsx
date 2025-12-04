import {
  FileTextIcon,
  MessageCircleIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

const iconMap = {
  FileTextIcon,
  MessageCircleIcon,
  UsersIcon,
  VideoIcon,
} as const;

type IconName = keyof typeof iconMap;

export const Agenda = ({
  className,
  suggestions,
  tasks,
}: {
  className?: string;
  suggestions: {
    id: number;
    text: string;
  }[];
  tasks: {
    icon: IconName;
    id: number;
    text: string;
  }[];
}) => {
  const { t } = useTranslation("organizations", {
    keyPrefix: "jobsAndClients.agenda",
  });
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  const toggleTask = (taskId: number) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const completedCount = completedTasks.size;
  const totalTasks = tasks.length;
  const progressPercentage =
    totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <div
      className={cn(
        "bg-surface squircle-rounded-3xl h-full p-6 text-black dark:text-white",
        className,
      )}
    >
      <h2 className="mb-6 text-lg font-medium">{t("title")}</h2>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-medium text-black dark:text-white">
            {t("todaysTasks")}
          </h3>
          <span className="text-xs text-neutral-400">
            {completedCount}/{totalTasks}
          </span>
        </div>

        <Progress className="mb-4" value={progressPercentage} />

        <ul className="space-y-3">
          {tasks.map((task) => {
            const Icon = iconMap[task.icon];
            const isCompleted = completedTasks.has(task.id);
            return (
              <li className="flex items-start gap-3" key={task.id}>
                <Icon className="mt-0.5 size-4 shrink-0 text-neutral-300 dark:text-neutral-700" />
                <button
                  className={cn(
                    "text-left text-sm text-neutral-900 dark:text-gray-200 transition-all cursor-pointer hover:opacity-80",
                    isCompleted &&
                      "line-through opacity-60 text-neutral-500 dark:text-neutral-500",
                  )}
                  onClick={() => toggleTask(task.id)}
                  type="button"
                >
                  {task.text}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="mb-4 text-base font-medium text-black dark:text-white">
          {t("aiSuggestions")}
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
