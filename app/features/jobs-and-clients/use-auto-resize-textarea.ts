/**
 * Custom hook for auto-resizing textarea
 */

import { useCallback } from "react";

export function useAutoResizeTextarea() {
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 7.5 * 16)}px`;
  }, []);

  return { handleInput };
}
