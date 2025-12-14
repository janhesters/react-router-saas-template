import { BotMessageSquare } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { Button } from "~/components/ui/button";

type AIBubbleButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function AIBubbleButton(props: AIBubbleButtonProps) {
  return (
    <Button
      {...props}
      aria-label="Open AI assistant"
      className="fixed lg:hidden bottom-4 right-4 h-20 w-20 rounded-full border bg-background shadow-md flex items-center justify-center"
    >
      <BotMessageSquare size={32} />
    </Button>
  );
}
