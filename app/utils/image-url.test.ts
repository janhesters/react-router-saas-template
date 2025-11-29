import { describe, expect, test } from "vitest";

import { getOptimizedImageUrl } from "./image-url";

describe("getOptimizedImageUrl", () => {
  test("should: return empty string for null or undefined", () => {
    expect(getOptimizedImageUrl(null)).toEqual("");
    expect(getOptimizedImageUrl(undefined)).toEqual("");
    expect(getOptimizedImageUrl("")).toEqual("");
  });

  test("should: encode Supabase Storage URL correctly", () => {
    const supabaseUrl =
      "https://xxx.supabase.co/storage/v1/object/public/app-images/user-avatars/abc123.jpg";

    const result = getOptimizedImageUrl(supabaseUrl);

    expect(result).toEqual(
      `/resources/images?src=${encodeURIComponent(supabaseUrl)}`,
    );
    expect(result).toContain("/resources/images?src=https%3A%2F%2F");
  });

  test("should: encode local filesystem path correctly", () => {
    const localPath = "/images/hero.png";

    const result = getOptimizedImageUrl(localPath);

    expect(result).toEqual(
      `/resources/images?src=${encodeURIComponent(localPath)}`,
    );
    expect(result).toContain("/resources/images?src=%2Fimages%2F");
  });

  test("should: handle special characters with URL encoding", () => {
    const urlWithSpecialChars =
      "https://xxx.supabase.co/storage/v1/object/public/app-images/user name+test.jpg";

    const result = getOptimizedImageUrl(urlWithSpecialChars);

    expect(result).toContain("/resources/images?src=");
    expect(result).toContain("%20"); // space encoded
  });
});
