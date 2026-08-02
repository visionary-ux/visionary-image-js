import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  initVisionaryImages,
  observeVisionaryImages,
} from "../src/lib/browser";
import * as stateLib from "../src/lib/state";
import { TEST_VISIONARY_URL } from "./fixtures";

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
      <div data-visionary><canvas></canvas><img src="${TEST_VISIONARY_URL}" /></div>
      <div data-visionary><canvas></canvas><img src="${TEST_VISIONARY_URL}" /></div>
    `;

    expect(initVisionaryImages({ canvasSize: 4 })).toBe(2);

    const elements = document.querySelectorAll("[data-visionary]");
    expect(
      Array.from(elements).every((element) => element.hasAttribute("data-v7y"))
    ).toBe(true);
    expect(putImageData).toHaveBeenCalledTimes(2);
  });

  test("paints synchronously when eagerCanvasPaint is set, without requestAnimationFrame", () => {
    const raf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);

    document.body.innerHTML = `
      <div data-visionary><canvas></canvas><img src="${TEST_VISIONARY_URL}" /></div>
    `;

    expect(initVisionaryImages({ canvasSize: 4, eagerCanvasPaint: true })).toBe(
      1
    );

    expect(raf).not.toHaveBeenCalled();
    expect(putImageData).toHaveBeenCalledOnce();
    expect(
      document.querySelector("[data-visionary]")?.hasAttribute("data-v7y")
    ).toBe(true);
  });

  test("queues source-bearing containers and skips malformed paint targets", () => {
    document.body.innerHTML = `
      <div data-visionary data-v7y><canvas></canvas><img src="${TEST_VISIONARY_URL}" /></div>
      <div data-visionary><canvas></canvas></div>
      <div data-visionary><img src="${TEST_VISIONARY_URL}" /></div>
    `;

    expect(initVisionaryImages()).toBe(2);
    expect(putImageData).toHaveBeenCalledOnce();
  });

  test("observes newly inserted Visionary descendants", async () => {
    const root = document.createElement("section");
    document.body.append(root);
    const observer = observeVisionaryImages({ canvasSize: 4, root });

    root.innerHTML = `
      <div>
        <div data-visionary><canvas></canvas><img src="${TEST_VISIONARY_URL}" /></div>
      </div>
    `;

    await vi.waitFor(() => {
      expect(
        root.querySelector("[data-visionary]")?.hasAttribute("data-v7y")
      ).toBe(true);
    });
    expect(putImageData).toHaveBeenCalledOnce();

    observer.disconnect();
  });
});

describe("image decorating", () => {
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

  test("wraps a bare img carrying a Visionary Code", () => {
    document.body.innerHTML = `<img id="hero" src="${TEST_VISIONARY_URL}" alt="Hero" />`;

    expect(initVisionaryImages({ canvasSize: 4 })).toBe(1);

    const image = document.querySelector("#hero") as HTMLImageElement;
    const container = image.parentElement as HTMLElement;

    expect(container.tagName).toBe("DIV");
    expect(container.hasAttribute("data-v7y")).toBe(true);
    expect(container.hasAttribute("data-visionary")).toBe(true);
    expect(container.getAttribute("style")).toContain("aspect-ratio:");
    expect(container.getAttribute("style")).toContain("background-color:");
    expect(container.querySelector("canvas")).not.toBeNull();
    expect(putImageData).toHaveBeenCalledOnce();
  });

  test("preserves the author's src, alt, and position in the document", () => {
    document.body.innerHTML = `<section><p>before</p><img src="${TEST_VISIONARY_URL}" alt="Hero" loading="eager" /></section>`;

    initVisionaryImages();

    const image = document.querySelector("img") as HTMLImageElement;
    expect(image.getAttribute("src")).toBe(TEST_VISIONARY_URL);
    expect(image.getAttribute("alt")).toBe("Hero");
    expect(image.getAttribute("loading")).toBe("eager");

    const section = document.querySelector("section") as HTMLElement;
    expect(section.children[0].tagName).toBe("P");
    expect(section.children[1].getAttribute("data-visionary")).toBe("");
  });

  test("ignores images without Blurhash URL data", () => {
    document.body.innerHTML = `
      <img src="https://example.com/photo.jpg" />
      <img src="" />
      <img />
    `;

    expect(initVisionaryImages()).toBe(0);
    expect(document.querySelectorAll("[data-visionary]")).toHaveLength(0);
  });

  test("rejects certain non-Blurhash URLs before computeImageState", () => {
    const computeSpy = vi.spyOn(stateLib, "computeImageState");
    document.body.innerHTML = `
      <img src="https://example.com/photo.jpg" />
      <img src="https://cdn.example.com/assets/image.jpg" />
      <img src="/static/logo.svg" />
      <img src="https://example.com/foo/image/bar.jpg" />
    `;

    expect(initVisionaryImages()).toBe(0);
    expect(computeSpy).not.toHaveBeenCalled();
  });

  test("warns once for an invalid `target` selector, even with debug off", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.innerHTML = `<img src="${TEST_VISIONARY_URL}" />`;

    expect(initVisionaryImages({ target: "img)" })).toBe(0);
    expect(initVisionaryImages({ target: "img)" })).toBe(0);

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.join(" ")).toContain(
      "Invalid `target` selector"
    );
  });

  test("does not wrap images inside React-owned [data-v7y] containers", () => {
    document.body.innerHTML = `
      <div data-v7y>
        <img id="react-owned" src="${TEST_VISIONARY_URL}" />
      </div>
    `;

    expect(initVisionaryImages()).toBe(0);
    expect(document.querySelector("#react-owned")?.parentElement?.tagName).toBe(
      "DIV"
    );
    expect(document.querySelectorAll("[data-visionary]")).toHaveLength(0);
  });

  test("skips images marked with data-visionary-skip", () => {
    document.body.innerHTML = `<img data-visionary-skip src="${TEST_VISIONARY_URL}" />`;

    expect(initVisionaryImages()).toBe(0);
    expect(document.querySelectorAll("[data-visionary]")).toHaveLength(0);
  });

  test("honors a narrowed image target", () => {
    document.body.innerHTML = `
      <main><img id="inside" src="${TEST_VISIONARY_URL}" /></main>
      <aside><img id="outside" src="${TEST_VISIONARY_URL}" /></aside>
      <aside><img id="marked" class="visionary-image" src="${TEST_VISIONARY_URL}" /></aside>
    `;

    expect(initVisionaryImages({ target: ".visionary-image" })).toBe(1);

    expect(document.querySelector("#inside")?.parentElement?.tagName).toBe(
      "MAIN"
    );
    expect(document.querySelector("#outside")?.parentElement?.tagName).toBe(
      "ASIDE"
    );
    expect(document.querySelector("#marked")?.parentElement?.tagName).toBe(
      "DIV"
    );
  });

  test("does not re-wrap images inside server-rendered markup", () => {
    document.body.innerHTML = `
      <div data-visionary>
        <canvas></canvas>
        <img src="${TEST_VISIONARY_URL}" />
      </div>
    `;

    expect(initVisionaryImages({ canvasSize: 4 })).toBe(1);
    expect(document.querySelectorAll("[data-visionary]")).toHaveLength(1);
    expect(putImageData).toHaveBeenCalledOnce();
  });

  test("decorates the same image only once across repeated passes", () => {
    document.body.innerHTML = `<img src="${TEST_VISIONARY_URL}" />`;

    expect(initVisionaryImages({ canvasSize: 4 })).toBe(1);
    expect(initVisionaryImages({ canvasSize: 4 })).toBe(0);
    expect(document.querySelectorAll("[data-visionary]")).toHaveLength(1);
  });

  test("decorates images added after load", async () => {
    const root = document.createElement("section");
    document.body.append(root);
    const observer = observeVisionaryImages({ canvasSize: 4, root });

    root.innerHTML = `<div><img id="late" src="${TEST_VISIONARY_URL}" /></div>`;

    await vi.waitFor(() => {
      expect(
        root.querySelector("[data-visionary]")?.hasAttribute("data-v7y")
      ).toBe(true);
    });
    expect(root.querySelector("#late")?.parentElement?.tagName).toBe("DIV");
    expect(putImageData).toHaveBeenCalledOnce();

    observer.disconnect();
  });

  test("reconsiders an existing image when its src attribute changes", async () => {
    const root = document.createElement("section");
    root.innerHTML = `<img id="swap" src="https://example.com/ordinary.jpg" />`;
    document.body.append(root);
    const observer = observeVisionaryImages({ canvasSize: 4, root });

    const image = root.querySelector("#swap") as HTMLImageElement;
    image.setAttribute("src", TEST_VISIONARY_URL);

    await vi.waitFor(() => {
      expect(image.parentElement?.getAttribute("data-visionary")).toBe("");
      expect(image.parentElement?.hasAttribute("data-v7y")).toBe(true);
    });
    expect(putImageData).toHaveBeenCalledOnce();

    observer.disconnect();
  });
});
