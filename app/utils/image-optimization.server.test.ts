import { describe, expect, test } from "vitest";

import { getImageSource } from "./image-optimization.server";

const createUrl = (src?: string) =>
  `http://localhost:3000/resources/images${src ? `?src=${encodeURIComponent(src)}` : ""}`;

describe("getImageSource", () => {
  describe("given: request without src parameter", () => {
    test("should: throw 400 error", async () => {
      const request = new Request(createUrl());

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(400);
        const text = await (error as Response).text();
        expect(text).toContain("Missing src parameter");
      }
    });
  });

  describe("given: request with path traversal attempt", () => {
    test("should: reject and throw 403 error", async () => {
      const request = new Request(createUrl("../../../etc/passwd"));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(403);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid image path");
      }
    });
  });

  describe("given: request with path outside /images/ directory", () => {
    test("should: reject and throw 403 error", async () => {
      const request = new Request(createUrl("/app/utils/secret.ts"));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(403);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid image path");
      }
    });

    test("should: reject path separator prefix attacks", async () => {
      // Attempting to access /public/images-backup/ by exploiting string prefix matching
      const request = new Request(createUrl("/images-backup/secret.png"));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(403);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid image path");
      }
    });
  });

  describe("given: request with invalid file extension", () => {
    test("should: reject non-image files", async () => {
      const request = new Request(createUrl("/images/malicious.exe"));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(400);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid file type");
      }
    });

    test("should: reject extension after valid extension", async () => {
      const request = new Request(createUrl("/images/test.png.exe"));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(400);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid file type");
      }
    });
  });

  describe("given: request with external URL (not Supabase Storage)", () => {
    test("should: reject arbitrary external URLs", async () => {
      const request = new Request(
        "http://localhost:3000/resources/images?src=http://evil.com/malware.png",
      );

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(403);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid storage URL");
      }
    });

    test("should: reject non-Supabase HTTPS URLs", async () => {
      const request = new Request(
        "http://localhost:3000/resources/images?src=https://example.com/image.png",
      );

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(403);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid storage URL");
      }
    });
  });

  describe("given: request with Supabase Storage URL", () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const validStorageUrl = `${supabaseUrl}/storage/v1/object/public/app-images/user-avatars/abc123.png`;

    test("should: return fetch source for valid Supabase Storage URL", async () => {
      const request = new Request(createUrl(validStorageUrl));

      const result = await getImageSource({ request });

      expect(result.type).toEqual("fetch");
      if (result.type === "fetch") {
        expect(result.url).toEqual(validStorageUrl);
      }
    });

    test("should: reject URL from different Supabase instance", async () => {
      const differentInstanceUrl =
        "https://different-project.supabase.co/storage/v1/object/public/app-images/avatar.png";
      const request = new Request(createUrl(differentInstanceUrl));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(403);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid storage URL");
      }
    });

    test("should: reject private storage URLs", async () => {
      // Using /object/ instead of /object/public/
      const privateUrl = `${supabaseUrl}/storage/v1/object/app-images/avatar.png`;
      const request = new Request(createUrl(privateUrl));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(403);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid storage path");
      }
    });

    test("should: reject unauthorized bucket", async () => {
      const unauthorizedBucketUrl = `${supabaseUrl}/storage/v1/object/public/unauthorized-bucket/file.png`;
      const request = new Request(createUrl(unauthorizedBucketUrl));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(403);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid storage bucket");
      }
    });

    test("should: reject invalid file extension in Storage URL", async () => {
      const invalidExtUrl = `${supabaseUrl}/storage/v1/object/public/app-images/user-avatars/malware.exe`;
      const request = new Request(createUrl(invalidExtUrl));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(400);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid file type");
      }
    });

    test("should: reject malformed Storage URL", async () => {
      const malformedUrl = `${supabaseUrl}/storage/v1/object/public/`;
      const request = new Request(createUrl(malformedUrl));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(400);
        const text = await (error as Response).text();
        expect(text).toContain("Invalid storage URL format");
      }
    });
  });

  describe("given: request with valid image path", () => {
    test("should: return filesystem source for existing image", async () => {
      const request = new Request(createUrl("/images/app-light.png"));

      const result = await getImageSource({ request });

      expect(result.type).toEqual("fs");
      if (result.type === "fs") {
        expect(result.path).toContain("public");
        expect(result.path).toContain("images");
        expect(result.path).toContain("app-light.png");
      }
    });

    test("should: throw 404 for non-existent image", async () => {
      const request = new Request(createUrl("/images/non-existent.png"));

      try {
        await getImageSource({ request });
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(404);
        const text = await (error as Response).text();
        expect(text).toContain("Image not found");
      }
    });
  });
});
