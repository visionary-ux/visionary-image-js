// @vitest-environment node

import { beforeEach, describe, expect, test } from "vitest";

import {
  clearCache,
  decodeWithCache,
  getPixelCache,
  isCached,
} from "../src/lib/cache";
import { TEST_BLURHASH } from "./fixtures";

describe("pixel cache in SSR environments", () => {
  beforeEach(() => {
    clearCache();
  });

  test("uses a shared module-local cache without window", () => {
    const first = decodeWithCache(TEST_BLURHASH, 4, 1);
    const second = decodeWithCache(TEST_BLURHASH, 4, 1);

    expect(first).not.toBeNull();
    expect(first).toBe(second);
    expect(getPixelCache()).toBe(getPixelCache());
    expect(isCached(TEST_BLURHASH, 4, 1)).toBe(true);
  });

  test("clears the SSR cache", () => {
    decodeWithCache(TEST_BLURHASH, 4, 1);
    clearCache();

    expect(getPixelCache().size).toBe(0);
  });
});
