import { access } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import type { ImgSource } from "openimg/node";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"];
const ALLOWED_STORAGE_BUCKETS = ["app-images"];

/**
 * Determines the source of an image based on the request.
 * Supports both local filesystem images and Supabase Storage URLs.
 *
 * @param request - The incoming request
 * @returns ImageSource configuration for openimg
 * @throws {Response} 400 if src parameter is missing or invalid format
 * @throws {Response} 403 if the image path is invalid or unauthorized
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

  // Check if this is a Supabase Storage URL
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return handleSupabaseStorageUrl(src);
  }

  // Handle local filesystem images
  return handleLocalFilesystemImage(src);
}

/**
 * Handles Supabase Storage URLs.
 * Only allows URLs from the configured Supabase instance and approved buckets.
 */
async function handleSupabaseStorageUrl(src: string): Promise<ImgSource> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Response("Storage not configured", { status: 500 });
  }

  // Ensure URL is from our Supabase instance
  if (!src.startsWith(supabaseUrl)) {
    throw new Response("Invalid storage URL", { status: 403 });
  }

  // Ensure it's a public storage URL
  if (!src.includes("/storage/v1/object/public/")) {
    throw new Response("Invalid storage path", { status: 403 });
  }

  // Extract bucket name from URL
  // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const bucketMatch = src.match(/\/storage\/v1\/object\/public\/([^/]+)\//);

  if (!bucketMatch || !bucketMatch[1]) {
    throw new Response("Invalid storage URL format", { status: 400 });
  }

  const bucket = bucketMatch[1];

  // Only allow approved buckets
  if (!ALLOWED_STORAGE_BUCKETS.includes(bucket)) {
    throw new Response("Invalid storage bucket", { status: 403 });
  }

  // Check file extension
  const ext = extname(src).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Response("Invalid file type", { status: 400 });
  }

  return {
    type: "fetch",
    url: src,
  };
}

/**
 * Handles local filesystem images.
 * Only allows images from the public/images directory.
 */
async function handleLocalFilesystemImage(src: string): Promise<ImgSource> {
  // Only allow /images/ paths
  if (!src.startsWith("/images/")) {
    throw new Response("Invalid image path", {
      status: 403,
    });
  }

  // Check file extension
  const ext = extname(src).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Response("Invalid file type", { status: 400 });
  }

  // Build full path
  const filePath = src.slice(1); // Remove leading slash
  const fullPath = resolve(process.cwd(), "public", filePath);

  // Security: Ensure path is within public/images
  // Add path separator to prevent prefix attacks (e.g., /images-backup/)
  const allowedDir = resolve(process.cwd(), "public", "images") + sep;
  if (!fullPath.startsWith(allowedDir)) {
    throw new Response("Invalid image path", { status: 403 });
  }

  // Check if file exists (async to avoid blocking event loop)
  try {
    await access(fullPath);
  } catch {
    throw new Response("Image not found", { status: 404 });
  }

  return {
    path: fullPath,
    type: "fs",
  };
}
