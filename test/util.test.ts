import { describe, expect, test } from "vitest";

import {
  createUrl,
  generateRgbaString,
  getMaxEdgeLength,
  hexToRGB,
  round,
  swapUrlOrigin,
} from "../src/lib/util";

describe("utilities", () => {
  test("creates URLs only from absolute URL strings", () => {
    expect(createUrl("https://visionary.test/image.jpg")?.hostname).toBe(
      "visionary.test"
    );
    expect(createUrl("/image.jpg")).toBeNull();
    expect(createUrl("not a url")).toBeNull();
  });

  test("formats an RGB color with alpha", () => {
    expect(generateRgbaString({ r: 2, g: 4, b: 8 }, 0.75)).toBe(
      "rgba(2,4,8,0.75)"
    );
  });

  test.each([
    ["#72615a", { r: 114, g: 97, b: 90 }],
    ["07F", { r: 0, g: 119, b: 255 }],
    ["#12", null],
  ])("parses hex color %s", (hex, expected) => {
    expect(hexToRGB(hex)).toEqual(expected);
  });

  test("limits an image edge to the source dimensions", () => {
    expect(getMaxEdgeLength(640, 1_000)).toBe(640);
    expect(getMaxEdgeLength(1_920, 1_000)).toBe(1_000);
  });

  test("rounds to the requested precision", () => {
    expect(round(4.2)).toBe(4);
    expect(round(1.23456, 3)).toBe(1.235);
  });

  test("replaces a URL origin while preserving its path and query", () => {
    expect(
      swapUrlOrigin(
        "https://old.test/image/photo.jpg?size=sm",
        "https://cdn.test/base"
      )
    ).toBe("https://cdn.test/image/photo.jpg?size=sm");
  });

  test("leaves the input unchanged when either URL is invalid", () => {
    expect(swapUrlOrigin("/image.jpg", "https://cdn.test")).toBe("/image.jpg");
    expect(swapUrlOrigin("https://old.test/image.jpg", "not an endpoint")).toBe(
      "https://old.test/image.jpg"
    );
  });
});
