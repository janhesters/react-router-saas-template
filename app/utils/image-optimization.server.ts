import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";
import type { ImgSource } from "openimg/node";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"];

/**
 * Determines the source of an image based on the request.
 * Only allows images from the public/images directory with valid extensions.
 *
 * @param request - The incoming request
 * @returns ImageSource configuration for openimg
 * @throws {Response} 400 if src parameter is missing or invalid format
 * @throws {Response} 403 if the image path is invalid or outside public/images
 * @throws {Response} 404 if the image file does not exist
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

  // Only allow /images/ paths
  if (!src.startsWith("/images/")) {
    throw new Response("Only images from /images/ directory are allowed", {
      status: 403,
    });
  }

  // Check file extension
  const ext = extname(src).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Response(
      `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      { status: 400 },
    );
  }

  // Build full path
  const filePath = src.slice(1); // Remove leading slash
  const fullPath = resolve(process.cwd(), "public", filePath);

  // Security: Ensure path is within public/images
  const allowedDir = resolve(process.cwd(), "public", "images");
  if (!fullPath.startsWith(allowedDir)) {
    throw new Response("Invalid image path", { status: 403 });
  }

  // Check if file exists
  if (!existsSync(fullPath)) {
    throw new Response("Image not found", { status: 404 });
  }

  return {
    path: fullPath,
    type: "fs",
  };
}
