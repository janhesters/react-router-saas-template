import { dummyAIMessage } from "../dashboard-data/dashboardDummyData";
import AIMessage from "./ai-message";

export default function AIChat() {
  return (
    <div className="flex flex-col gap-4">
      {dummyAIMessage.map((message) => (
        <AIMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
