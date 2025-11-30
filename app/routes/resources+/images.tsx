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
  const cacheFolder = process.env.OPENIMG_CACHE_DIR || "./data/images";
  const supabaseUrl = process.env.VITE_SUPABASE_URL;

  const response = await getImgResponse(request, {
    allowlistedOrigins: supabaseUrl ? [supabaseUrl] : [],
    cacheFolder,
    getImgSource: getImageSource,
  });

  // Only set long-term cache headers for successful responses
  // Don't cache errors (404, 403, 400, etc.)
  if (response.ok) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } else {
    // Cache errors for a short time to prevent repeated processing
    response.headers.set("Cache-Control", "public, max-age=60");
  }

  return response;
}
