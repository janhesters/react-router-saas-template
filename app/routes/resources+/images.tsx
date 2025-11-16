import { getImgResponse } from "openimg/node";

import type { Route } from "./+types/images";
import { getImageSource } from "~/utils/image-optimization.server";

/**
 * Image optimization endpoint using openimg.
 * Handles image transformations, caching, and serving optimized images.
 *
 * Query parameters:
 * - src: Source image URL or path
 * - w: Width
 * - h: Height
 * - format: Image format (webp, avif, png, jpg)
 * - fit: How to fit the image (cover, contain, fill, inside, outside)
 */
export async function loader({ request }: Route.LoaderArgs) {
  const headers = new Headers();
  // Set long-term cache headers for optimized images
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return getImgResponse(request, {
    getImgSource: getImageSource,
    headers,
  });
}
