import type { SVGProps } from "react";
import { useId } from "react";

import { cn } from "~/lib/utils";

export type Iphone15ProProps = {
  width?: number;
  height?: number;
  src?: string;
  videoSrc?: string;
} & SVGProps<SVGSVGElement>;

export function Iphone15Pro({
  className,
  height,
  src,
  videoSrc,
  width,
  ...props
}: Iphone15ProProps) {
  const id = useId();

  return (
    <svg
      className={cn("h-auto max-h-[882px] w-full max-w-[433px]", className)}
      fill="none"
      height={height}
      viewBox="0 0 433 882"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Iphone 15 Pro</title>
      <path
        className="fill-[#E5E5E5] dark:fill-[#404040]"
        d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z"
      />

      <path
        className="fill-[#E5E5E5] dark:fill-[#404040]"
        d="M0 171C0 170.448 0.447715 170 1 170H3V204H1C0.447715 204 0 203.552 0 203V171Z"
      />

      <path
        className="fill-[#E5E5E5] dark:fill-[#404040]"
        d="M1 234C1 233.448 1.44772 233 2 233H3.5V300H2C1.44772 300 1 299.552 1 299V234Z"
      />

      <path
        className="fill-[#E5E5E5] dark:fill-[#404040]"
        d="M1 319C1 318.448 1.44772 318 2 318H3.5V385H2C1.44772 385 1 384.552 1 384V319Z"
      />

      <path
        className="fill-[#E5E5E5] dark:fill-[#404040]"
        d="M430 279H432C432.552 279 433 279.448 433 280V384C433 384.552 432.552 385 432 385H430V279Z"
      />

      <path
        className="fill-white dark:fill-[#262626]"
        d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z"
      />

      <path
        className="fill-[#E5E5E5] dark:fill-[#404040]"
        d="M174 5H258V5.5C258 6.60457 257.105 7.5 256 7.5H176C174.895 7.5 174 6.60457 174 5.5V5Z"
        opacity="0.5"
      />

      <path
        className="fill-[#E5E5E5] stroke-[#E5E5E5] stroke-[0.5] dark:fill-[#404040] dark:stroke-[#404040]"
        d="M21.25 75C21.25 44.2101 46.2101 19.25 77 19.25H355C385.79 19.25 410.75 44.2101 410.75 75V807C410.75 837.79 385.79 862.75 355 862.75H77C46.2101 862.75 21.25 837.79 21.25 807V75Z"
      />

      {src && (
        <image
          clipPath={`url(#${`roundedCorners-${id}`})`}
          height="843.5"
          href={src}
          preserveAspectRatio="xMidYMid slice"
          width="389.5"
          x="21.25"
          y="19.25"
        />
      )}

      {videoSrc && (
        <foreignObject height="843.5" width="389.5" x="21.25" y="19.25">
          <video
            autoPlay
            className="size-full overflow-hidden rounded-[55.75px] object-cover"
            loop
            muted
            playsInline
            src={videoSrc}
          />
        </foreignObject>
      )}

      <path
        className="fill-[#F5F5F5] dark:fill-[#262626]"
        d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"
      />

      <path
        className="fill-[#F5F5F5] dark:fill-[#262626]"
        d="M249 48.5C249 42.701 253.701 38 259.5 38C265.299 38 270 42.701 270 48.5C270 54.299 265.299 59 259.5 59C253.701 59 249 54.299 249 48.5Z"
      />

      <path
        className="fill-[#E5E5E5] dark:fill-[#404040]"
        d="M254 48.5C254 45.4624 256.462 43 259.5 43C262.538 43 265 45.4624 265 48.5C265 51.5376 262.538 54 259.5 54C256.462 54 254 51.5376 254 48.5Z"
      />

      <defs>
        <clipPath id={`roundedCorners-${id}`}>
          <rect
            height="843.5"
            rx="55.75"
            ry="55.75"
            width="389.5"
            x="21.25"
            y="19.25"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
