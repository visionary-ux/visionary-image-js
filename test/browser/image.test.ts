import { afterEach, describe, expect, test } from "vitest";

import { initVisionaryImages } from "../../dist/visionary-image-js.js";
import { TEST_VISIONARY_URL } from "../fixtures";

describe("Chromium runtime", () => {
  afterEach(() => {
    document.body.replaceChildren();
    window.V7Y_PIXEL_CACHE = new Map();
  });

  test("uses browser APIs without Node.js globals", () => {
    expect(typeof window).toBe("object");
    expect(typeof document.createElement("canvas").getContext).toBe("function");
    expect("Buffer" in globalThis).toBe(false);
  });

  test("decorates an image and paints its Blurhash canvas", () => {
    document.body.innerHTML = `<img alt="Browser runtime image" src="${TEST_VISIONARY_URL}" />`;

    expect(initVisionaryImages({ eagerCanvasPaint: true })).toBe(1);

    const image = document.querySelector("img");
    const container = image?.closest("[data-visionary]");
    const canvas = container?.querySelector("canvas");

    expect(container).toBeInstanceOf(HTMLDivElement);
    expect(container?.hasAttribute("data-v7y")).toBe(true);
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas?.width).toBe(24);
    expect(canvas?.height).toBe(24);
    expect(image?.alt).toBe("Browser runtime image");
    expect(image?.src).toBe(TEST_VISIONARY_URL);

    const pixel = canvas!.getContext("2d")!.getImageData(0, 0, 1, 1).data;
    expect(pixel[3]).toBeGreaterThan(0);
  });

  test("leaves ordinary image URLs unchanged", () => {
    document.body.innerHTML =
      '<img alt="Ordinary image" src="https://example.com/photo.jpg" />';

    expect(initVisionaryImages({ eagerCanvasPaint: true })).toBe(0);
    expect(document.querySelector("[data-visionary]")).toBeNull();
    expect(document.querySelector("img")?.parentElement).toBe(document.body);
  });
});
