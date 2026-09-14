/* The numbers are random numbers, there is no good description for the numbers. */
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { cn } from "~/lib/utils";

interface LightRaysProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
  count?: number;
  color?: string;
  blur?: number;
  speed?: number;
  length?: string;
  prefersReducedMotion?: boolean;
}

type LightRay = {
  delay: number;
  duration: number;
  id: string;
  intensity: number;
  left: number;
  rotate: number;
  swing: number;
  width: number;
};

const createRays = (count: number, cycle: number): LightRay[] => {
  if (count <= 0) return [];

  return Array.from({ length: count }, (_, index) => {
    const left = 8 + Math.random() * 84;
    const rotate = -28 + Math.random() * 56;
    const width = 160 + Math.random() * 160;
    const swing = 0.8 + Math.random() * 1.8;
    const delay = Math.random() * cycle;
    const duration = cycle * (0.75 + Math.random() * 0.5);
    const intensity = 0.6 + Math.random() * 0.5;

    return {
      delay,
      duration,
      id: `${index}-${Math.round(left * 10)}`,
      intensity,
      left,
      rotate,
      swing,
      width,
    };
  });
};

const Ray = ({
  delay,
  duration,
  intensity,
  left,
  prefersReducedMotion,
  rotate,
  swing,
  width,
}: LightRay & { prefersReducedMotion?: boolean }) => {
  return (
    <motion.div
      animate={
        prefersReducedMotion
          ? {}
          : {
              opacity: [0, intensity, 0],
              rotate: [rotate - swing, rotate + swing, rotate - swing],
            }
      }
      className="pointer-events-none absolute -top-[12%] left-(--ray-left) h-(--light-rays-length) w-(--ray-width) origin-top -translate-x-1/2 rounded-full bg-linear-to-b from-[color-mix(in_srgb,var(--light-rays-color)_70%,transparent)] to-transparent opacity-0 mix-blend-screen blur-(--light-rays-blur)"
      initial={
        prefersReducedMotion
          ? { opacity: intensity * 0.3, rotate: rotate }
          : { rotate: rotate }
      }
      style={
        {
          "--ray-left": `${left}%`,
          "--ray-width": `${width}px`,
        } as CSSProperties
      }
      transition={
        prefersReducedMotion
          ? {}
          : {
              delay: delay,
              duration: duration,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: duration * 0.1,
            }
      }
    />
  );
};

export function LightRays({
  blur = 36,
  className,
  color = "rgba(160, 210, 255, 0.2)",
  count = 7,
  length = "70vh",
  prefersReducedMotion = false,
  ref,
  speed = 14,
  style,
  ...props
}: LightRaysProps) {
  const [rays, setRays] = useState<LightRay[]>([]);
  const cycleDuration = Math.max(speed, 0.1);

  useEffect(() => {
    setRays(createRays(count, cycleDuration));
  }, [count, cycleDuration]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 isolate overflow-hidden rounded-[inherit]",
        className,
      )}
      ref={ref}
      style={
        {
          "--light-rays-blur": `${blur}px`,
          "--light-rays-color": color,
          "--light-rays-length": length,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 light-rays-glow-left"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 light-rays-glow-right"
        />
        {rays.map((ray) => (
          <Ray
            key={ray.id}
            {...ray}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>
    </div>
  );
}
