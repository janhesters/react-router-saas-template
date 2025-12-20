/**
 * biome-ignore-all lint/style/noMagicNumbers: The numbers are random numbers,
 * there is no good description for the numbers.
 */
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
  id: string;
  left: number;
  rotate: number;
  width: number;
  swing: number;
  delay: number;
  duration: number;
  intensity: number;
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
  left,
  rotate,
  width,
  swing,
  delay,
  duration,
  intensity,
  prefersReducedMotion,
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
      className="-top-[12%] -translate-x-1/2 pointer-events-none absolute left-(--ray-left) h-(--light-rays-length) w-(--ray-width) origin-top rounded-full bg-linear-to-b from-[color-mix(in_srgb,var(--light-rays-color)_70%,transparent)] to-transparent opacity-0 mix-blend-screen blur-(--light-rays-blur)"
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
  className,
  style,
  count = 7,
  color = "rgba(160, 210, 255, 0.2)",
  blur = 36,
  speed = 14,
  length = "70vh",
  prefersReducedMotion = false,
  ref,
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
          className="absolute inset-0 opacity-60"
          style={
            {
              background:
                "radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--light-rays-color) 45%, transparent), transparent 70%)",
            } as CSSProperties
          }
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={
            {
              background:
                "radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--light-rays-color) 35%, transparent), transparent 75%)",
            } as CSSProperties
          }
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
