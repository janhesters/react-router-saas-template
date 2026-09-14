import type { ComponentProps, ReactNode } from "react";

import { cn } from "~/lib/utils";

type MarqueeProps = {
  /**
   * Content to be displayed in the marquee
   */
  children: ReactNode;
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string;
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean;
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number;
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean;
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean;
} & ComponentProps<"div">;

export function Marquee({
  children,
  className,
  pauseOnHover = false,
  repeat = 4,
  reverse = false,
  vertical = false,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex [gap:var(--gap)] overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
        {
          "flex-col": vertical,
          "flex-row": !vertical,
        },
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, index) => (
        <div
          className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
            "[animation-direction:reverse]": reverse,
            "animate-marquee-vertical flex-col": vertical,
            "animate-marquee flex-row": !vertical,
            "group-hover:[animation-play-state:paused]": pauseOnHover,
          })}
          // oxlint-disable-next-line react/no-array-index-key -- we lack a better key
          key={index}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
