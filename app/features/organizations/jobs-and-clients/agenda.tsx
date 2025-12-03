import {
  FileTextIcon,
  MessageCircleIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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

  return (
    <div
      className={cn(
        "bg-surface squircle-rounded-3xl h-full p-6 text-black dark:text-white",
        className,
      )}
    >
      <h2 className="mb-6 text-lg font-medium">{t("title")}</h2>

      <div className="mb-8">
        <h3 className="mb-4 text-base font-medium text-black dark:text-white">
          {t("todaysTasks")}
        </h3>

        <ul className="space-y-3">
          {tasks.map((task) => {
            const Icon = iconMap[task.icon];
            return (
              <li className="flex items-start gap-3" key={task.id}>
                <Icon className="mt-0.5 size-4 shrink-0 text-neutral-300 dark:text-neutral-700" />
                <span className="text-sm text-neutral-900 dark:text-gray-200">
                  {task.text}
                </span>
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
