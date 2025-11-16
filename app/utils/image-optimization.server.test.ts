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
        expect(text).toContain(
          "Only images from /images/ directory are allowed",
        );
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
        expect(text).toContain(
          "Only images from /images/ directory are allowed",
        );
      }
    });
  });

  describe("given: request with invalid file extension", () => {
    test("should: reject .exe files", async () => {
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

    test("should: reject .json files", async () => {
      const request = new Request(createUrl("/images/config.json"));

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
    test("should: accept png files and return filesystem source", async () => {
      const request = new Request(createUrl("/images/app-light.png"));

      const result = await getImageSource({ request });

      expect(result.type).toEqual("fs");
      expect(result.path).toContain("public");
      expect(result.path).toContain("images");
      expect(result.path).toContain("app-light.png");
    });

    test("should: accept jpg files or throw 404 if not found", async () => {
      const request = new Request(createUrl("/images/test.jpg"));

      try {
        const result = await getImageSource({ request });
        expect(result.type).toEqual("fs");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(404);
      }
    });

    test("should: accept webp files or throw 404 if not found", async () => {
      const request = new Request(createUrl("/images/test.webp"));

      try {
        const result = await getImageSource({ request });
        expect(result.type).toEqual("fs");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toEqual(404);
      }
    });
  });
});
