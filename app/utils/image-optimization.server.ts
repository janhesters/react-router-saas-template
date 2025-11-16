import { resolve } from "node:path";
import type { ImgSource } from "openimg/node";

/**
 * Determines the source of an image based on the request.
 * Currently handles only public folder assets (static landing page images).
 *
 * @param request - The incoming request
 * @returns ImageSource configuration for openimg
 */
export async function getImageSource({
  request,
}: {
  request: Request;
}): Promise<ImgSource> {
  const url = new URL(request.url);
  const src = url.searchParams.get("src");

  if (!src) {
    throw new Response("Missing src parameter", { status: 400 });
  }

  // Handle filesystem images (public folder only)
  // Remove leading slash if present
  const filePath = src.startsWith("/") ? src.slice(1) : src;
  const fullPath = resolve(process.cwd(), "public", filePath);

  // Security check: ensure path is within public directory
  const publicDir = resolve(process.cwd(), "public");
  if (!fullPath.startsWith(publicDir)) {
    throw new Response("Invalid image path", { status: 403 });
  }

  return {
    path: fullPath,
    type: "fs",
  };
}
