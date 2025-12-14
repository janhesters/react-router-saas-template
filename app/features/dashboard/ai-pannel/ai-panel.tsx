import AIActions from "./ai-actions";
import AIChat from "./ai-chat";
import AIInput from "./ai-input";

export default function AIPanel() {
  return (
    <div className="w-96 flex flex-col border-l bg-background">
      <div className="border-b p-4">
        <h3 className="text-sm font-semibold">AI Assistant</h3>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="overflow-y-auto scrollbar-hidden pr-2">
          <AIChat />
        </div>

        <div className="mt-6">
          <AIInput />
        </div>
      </div>

      <div className="border-t p-4">
        <AIActions />
      </div>
    </div>
  );
}
