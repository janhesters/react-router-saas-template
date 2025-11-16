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
