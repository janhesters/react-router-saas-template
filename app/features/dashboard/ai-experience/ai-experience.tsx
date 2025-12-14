import { useState } from "react";

import AIPanel from "../ai-pannel/ai-panel";
import AIBubbleButton from "./ai-bubble-button";
import AIPanelMobileView from "./ai-panel-mobile-view";

export default function AIExperience() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden lg:block">
        <AIPanel />
      </div>

      <div className="lg:hidden">
        {open && <AIPanelMobileView onClose={() => setOpen(false)} />}
      </div>
      <AIBubbleButton onClick={() => console.log("clicked")} />
    </>
  );
}
