/** biome-ignore-all lint/style/noMagicNumbers: The numbers are random numbers,
 * there is no good description for the numbers.
 */
import type { COBEOptions } from "cobe";
import createGlobe from "cobe";
import { useMotionValue, useSpring } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

import { cn } from "~/lib/utils";

const MOVEMENT_DAMPING = 1400;

const GLOBE_CONFIG: COBEOptions = {
  baseColor: [1, 1, 1],
  dark: 0,
  devicePixelRatio: 1,
  diffuse: 0.4,
  glowColor: [1, 1, 1],
  height: 800,
  mapBrightness: 1.2,
  mapSamples: 8000,
  markerColor: [10 / 255, 10 / 255, 10 / 255],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
  onRender: () => {},
  phi: 0,
  theta: 0.3,
  width: 800,
};

export function Globe({
  className,
  config,
}: {
  className?: string;
  config?: Partial<COBEOptions>;
}) {
  const phi = useRef(0);
  const width = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  const mergedConfig: COBEOptions = useMemo(
    () => ({
      ...GLOBE_CONFIG,
      ...config,
    }),
    [config],
  );

  const r = useMotionValue(0);
  const rs = useSpring(r, {
    damping: 30,
    mass: 1,
    stiffness: 100,
  });

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      r.set(r.get() + delta / MOVEMENT_DAMPING);
    }
  };

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        width.current = canvasRef.current.offsetWidth;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    const devicePixelRatio = mergedConfig.devicePixelRatio ?? 2;
    // biome-ignore lint/style/noNonNullAssertion: The canvas is guaranteed to be available.
    const globe = createGlobe(canvasRef.current!, {
      ...mergedConfig,
      height: width.current * devicePixelRatio,
      onRender: (state) => {
        if (!pointerInteracting.current) phi.current += 0.005;
        state.phi = phi.current + rs.get();
        state.width = width.current * devicePixelRatio;
        state.height = width.current * devicePixelRatio;
      },
      width: width.current * devicePixelRatio,
    });

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    }, 0);
    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [rs, mergedConfig]);

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-square w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className={cn(
          "contain-[layout_paint_size] size-full opacity-0 transition-opacity duration-500",
        )}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX;
          updatePointerInteraction(e.clientX);
        }}
        onPointerOut={() => updatePointerInteraction(null)}
        onPointerUp={() => updatePointerInteraction(null)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
        ref={canvasRef}
      />
    </div>
  );
}
