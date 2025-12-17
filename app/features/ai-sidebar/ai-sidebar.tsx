import { useState } from "react";

import { cn } from "~/lib/utils";
import { AiSidebarBubble } from "./bubble/ai-sidebar-bubble";
import type { AiAssistantChatMessage } from "./chat/ai-sidebar-chat";
import { AiSidebarChat } from "./chat/ai-sidebar-chat";
import { AiSidebarContextualActions } from "./contextual-actions/ai-sidebar-contextual-actions";

export type { AiAssistantChatMessage };

export type AiSidebarProps = {
  chatMessages: AiAssistantChatMessage[];
};

export function AiSidebar({ chatMessages }: AiSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Floating button when collapsed */}
      {isCollapsed && <AiSidebarBubble onOpen={toggleCollapse} />}

      {/* Sidebar container - always in layout but hidden when collapsed */}
      <div
        className={cn(
          "bg-background border-l flex flex-col transition-all duration-200 ease-linear overflow-hidden",
          "self-stretch",
          isCollapsed ? "w-0 border-0" : "w-80",
        )}
      >
        {!isCollapsed && (
          <>
            <AiSidebarChat
              chatMessages={chatMessages}
              onCollapse={toggleCollapse}
            />
            <AiSidebarContextualActions />
          </>
        )}
      </div>
    </>
  );
}

