import { useEffect, useState } from "react";

/**
 * Hook to detect if the user prefers reduced motion.
 * Respects the system preference and updates when it changes.
 *
 * @returns boolean indicating if the user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);

    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
