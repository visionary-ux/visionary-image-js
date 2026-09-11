import { describe, expect, test, vi } from "vitest";

import {
  decodeWithCache,
  IS_SSR,
  renderVisionaryHTML,
} from "../../dist/visionary-image-js.js";
import { TEST_BLURHASH, TEST_VISIONARY_URL } from "../fixtures";

vi.stubGlobal("Buffer", undefined);

describe("Cloudflare Workers runtime", () => {
  test("uses Workers APIs without browser or Node.js globals", () => {
    const workerGlobal = globalThis as typeof globalThis & {
      Buffer?: unknown;
      WebSocketPair?: unknown;
    };

    expect(typeof workerGlobal.WebSocketPair).toBe("function");
    expect(typeof globalThis.atob).toBe("function");
    expect(typeof globalThis.btoa).toBe("function");
    expect("document" in globalThis).toBe(false);
    expect(workerGlobal.Buffer).toBeUndefined();
  });

  test("imports and runs the published SSR entry point", () => {
    const result = renderVisionaryHTML(TEST_VISIONARY_URL, {
      alt: "Worker-rendered image",
    });

    expect(IS_SSR).toBe(true);
    expect(result.state?.src).toBe(TEST_VISIONARY_URL);
    expect(result.html).toContain("data-visionary");
    expect(result.html).toContain('alt="Worker-rendered image"');
  });

  test("decodes and caches Blurhash pixels without Node.js APIs", () => {
    const pixels = decodeWithCache(TEST_BLURHASH, 4);

    expect(pixels).toBeInstanceOf(Uint8ClampedArray);
    expect(pixels).toHaveLength(4 * 4 * 4);
  });
});
