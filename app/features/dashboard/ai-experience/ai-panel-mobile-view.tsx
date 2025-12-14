import { X } from "lucide-react";

import AIActions from "../ai-pannel/ai-actions";
import AIChat from "../ai-pannel/ai-chat";
import AIInput from "../ai-pannel/ai-input";

type Props = {
  onClose: () => void;
};

export default function AIPanelMobileView({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-end p-4">
      <div className="w-full max-w-sm h-[80vh] border bg-background shadow-lg flex flex-col rounded-lg">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="text-sm font-semibold">AI Assistant</h3>
          <button
            className="text-sm hover:bg-muted rounded px-2 py-1"
            onClick={onClose}
            type="button"
          >
            <X />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between p-3 overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-hidden">
            <AIChat />
          </div>

          <div className="mt-4">
            <AIInput />
          </div>
        </div>

        <div className="border-t p-3">
          <AIActions />
        </div>
      </div>
    </div>
  );
}
