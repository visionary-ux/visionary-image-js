import { beforeEach, describe, expect, test } from "vitest";

import {
  clearCache,
  decodeWithCache,
  getPixelCache,
  isCached,
} from "../src/lib/cache";
import { TEST_BLURHASH } from "./fixtures";

describe("pixel cache", () => {
  beforeEach(() => {
    delete window.V7Y_PIXEL_CACHE;
  });

  test("creates one shared cache on window", () => {
    expect(getPixelCache()).toBe(getPixelCache());
    expect(window.V7Y_PIXEL_CACHE).toBeInstanceOf(Map);
  });

  test("decodes and reuses pixels for the same inputs", () => {
    const first = decodeWithCache(TEST_BLURHASH, 4, 1);
    const second = decodeWithCache(TEST_BLURHASH, 4, 1);

    expect(first).toBe(second);
    expect(first).toHaveLength(4 * 4 * 4);
    expect(isCached(TEST_BLURHASH, 4, 1)).toBe(true);
    expect(isCached(TEST_BLURHASH, 8, 1)).toBe(false);
  });

  test("clears cached pixels", () => {
    decodeWithCache(TEST_BLURHASH, 4, 1);
    clearCache();

    expect(getPixelCache().size).toBe(0);
  });
});
