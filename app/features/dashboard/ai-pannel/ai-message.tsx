import clsx from "clsx";

import type { AIMessage } from "../dashboard-data/types";

interface Props {
  message: AIMessage;
}

export default function AIMessageBubble({ message }: Props) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={clsx(
        "text-sm leading-relaxed",
        isAssistant ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {message.content}
    </div>
  );
}
