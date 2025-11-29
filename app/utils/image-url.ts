/**
 * Converts image URLs to optimized versions via openimg endpoint.
 * Works for both Supabase Storage URLs and local filesystem paths.
 *
 * @param url - The original image URL (Supabase Storage URL or local path)
 * @returns Optimized image URL that goes through /resources/images endpoint
 *
 * @example
 * // Supabase Storage URL
 * getOptimizedImageUrl("https://xxx.supabase.co/storage/.../avatar.jpg")
 * // Returns: "/resources/images?src=https%3A%2F%2Fxxx.supabase.co%2F..."
 *
 * @example
 * // Local path
 * getOptimizedImageUrl("/images/hero.png")
 * // Returns: "/resources/images?src=%2Fimages%2Fhero.png"
 */
export function getOptimizedImageUrl(url: string | null | undefined): string {
  if (!url) return "";

  // All images go through optimization endpoint
  return `/resources/images?src=${encodeURIComponent(url)}`;
}
