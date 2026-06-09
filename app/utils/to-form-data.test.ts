import { describe, expect, test } from "vitest";

import { toFormData } from "./to-form-data";

// Use `File` instances with a fixed `lastModified` timestamp because FormData
// wraps plain Blobs in Files stamped with the current time, which makes
// equality checks flaky.
const createFile = (content: string) =>
  new File([content], "blob", { lastModified: 0, type: "text/plain" });

describe("toFormData()", () => {
  test("given: an object, should: return the valid form data", () => {
    const file = createFile("content");
    const payload = {
      file,
      questions: ["What is up?", "Can you tell me?"],
      text: "Hello",
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append("file", file);
    expected.append("questions", "What is up?");
    expected.append("questions", "Can you tell me?");
    expected.append("text", "Hello");

    expect(actual).toEqual(expected);
  });

  test("given: an empty object, should: return an empty form data", () => {
    const payload = {};

    const actual = toFormData(payload);
    const expected = new FormData();

    expect(actual).toEqual(expected);
  });

  test("given: an object with only string values, should: return the valid form data", () => {
    const payload = {
      age: "30",
      name: "John Doe",
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append("age", "30");
    expected.append("name", "John Doe");

    expect(actual).toEqual(expected);
  });

  test("given: an object with only Blob values, should: return the valid form data", () => {
    const file1 = createFile("content1");
    const file2 = createFile("content2");
    const payload = { file1, file2 };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append("file1", file1);
    expected.append("file2", file2);

    expect(actual).toEqual(expected);
  });

  test("given: an object with only array of string values, should: return the valid form data", () => {
    const payload = {
      colors: ["red", "blue", "green"],
      sizes: ["S", "M", "L"],
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append("colors", "red");
    expected.append("colors", "blue");
    expected.append("colors", "green");
    expected.append("sizes", "S");
    expected.append("sizes", "M");
    expected.append("sizes", "L");

    expect(actual).toEqual(expected);
  });

  test("given: an object with undefined values, should: skip undefined values in form data", () => {
    const file = createFile("content");
    const payload = {
      age: undefined,
      file,
      name: "John Doe",
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append("file", file);
    expected.append("name", "John Doe");

    expect(actual).toEqual(expected);
  });
});
