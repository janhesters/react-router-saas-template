import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { usePrefersReducedMotion } from "~/hooks/use-prefers-reduced-motion";

export function FloatingPaths({ position }: { position: number }) {
  const { t } = useTranslation("userAuthentication", { keyPrefix: "layout" });
  const prefersReducedMotion = usePrefersReducedMotion();

  const paths = Array.from({ length: 36 }, (_, i) => ({
    color: `rgba(15,23,42,${0.1 + i * 0.03})`,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    id: i,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="text-primary h-full w-full"
        fill="none"
        viewBox="0 0 696 316"
      >
        <title>{t("backgroundPathsTitle")}</title>
        {paths.map((path) => (
          <motion.path
            animate={
              prefersReducedMotion
                ? {}
                : {
                    opacity: [0.3, 0.6, 0.3],
                    pathLength: 1,
                    pathOffset: [0, 1, 0],
                  }
            }
            d={path.d}
            initial={
              prefersReducedMotion
                ? { opacity: 0.4, pathLength: 0.8 }
                : { opacity: 0.6, pathLength: 0.3 }
            }
            key={path.id}
            stroke="currentColor"
            strokeOpacity={0.1 + path.id * 0.03}
            strokeWidth={path.width}
            transition={
              prefersReducedMotion
                ? {}
                : {
                    duration: 20 + Math.random() * 10,
                    ease: "linear",
                    repeat: Number.POSITIVE_INFINITY,
                  }
            }
          />
        ))}
      </svg>
    </div>
  );
}
