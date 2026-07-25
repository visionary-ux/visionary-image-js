import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  initVisionaryImages,
  observeVisionaryImages,
} from "../src/lib/browser";
import { TEST_BLURHASH } from "./fixtures";

describe("browser initialization", () => {
  const putImageData = vi.fn();

  beforeEach(() => {
    document.body.innerHTML = "";
    delete window.V7Y_PIXEL_CACHE;
    putImageData.mockClear();

    vi.stubGlobal(
      "requestAnimationFrame",
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 1;
      }
    );

    const context = {
      createImageData: (width: number, height: number) => ({
        colorSpace: "srgb",
        data: new Uint8ClampedArray(width * height * 4),
        height,
        width,
      }),
      putImageData,
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("renders and marks every eligible element", () => {
    document.body.innerHTML = `
      <div data-visionary data-blurhash="${TEST_BLURHASH}"><canvas></canvas></div>
      <div data-visionary data-blurhash="${TEST_BLURHASH}"><canvas></canvas></div>
    `;

    expect(initVisionaryImages({ canvasSize: 4 })).toBe(2);

    const elements = document.querySelectorAll("[data-visionary]");
    expect(
      Array.from(elements).every(
        (element) => element.getAttribute("data-v7y-init") === "true"
      )
    ).toBe(true);
    expect(putImageData).toHaveBeenCalledTimes(2);
  });

  test("does not retry initialized or malformed elements", () => {
    document.body.innerHTML = `
      <div data-visionary data-v7y-init="true" data-blurhash="${TEST_BLURHASH}">
        <canvas></canvas>
      </div>
      <div data-visionary><canvas></canvas></div>
      <div data-visionary data-blurhash="${TEST_BLURHASH}"></div>
    `;

    expect(initVisionaryImages()).toBe(2);
    expect(putImageData).not.toHaveBeenCalled();
    expect(document.querySelectorAll('[data-v7y-init="true"]')).toHaveLength(1);
  });

  test("observes newly inserted Visionary descendants", async () => {
    const root = document.createElement("section");
    document.body.append(root);
    const observer = observeVisionaryImages({ canvasSize: 4, root });

    root.innerHTML = `
      <div>
        <div data-visionary data-blurhash="${TEST_BLURHASH}">
          <canvas></canvas>
        </div>
      </div>
    `;

    await vi.waitFor(() => {
      expect(
        root.querySelector("[data-visionary]")?.getAttribute("data-v7y-init")
      ).toBe("true");
    });
    expect(putImageData).toHaveBeenCalledOnce();

    observer.disconnect();
  });
});
