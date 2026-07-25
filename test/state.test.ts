import { ImageSizeToken } from "blurhash-url/constants";
import { beforeEach, describe, expect, test } from "vitest";

import { clearCache } from "../src/lib/cache";
import { computeImageState } from "../src/lib/state";
import { TEST_VISIONARY_CODE, TEST_VISIONARY_URL } from "./fixtures";

describe(computeImageState.name, () => {
  beforeEach(() => {
    clearCache();
  });

  test("computes dimensions, color, and pixels from a Visionary URL", () => {
    const state = computeImageState(TEST_VISIONARY_URL);

    expect(state).toMatchObject({
      url: "XAoiu8Zsg7",
      bcc: "72615a",
      backgroundColor: "rgba(114,97,90,0.7)",
      maxWidth: 228,
      src: TEST_VISIONARY_URL,
    });
    expect(state?.pixels).toBeInstanceOf(Uint8ClampedArray);
    expect(state?.pixels).toHaveLength(24 * 24 * 4);
  });

  test("generates an image URL from a standalone Visionary code", () => {
    const state = computeImageState(TEST_VISIONARY_CODE, {
      size: ImageSizeToken.sm,
    });

    expect(state?.src).toContain("/image/");
    expect(state?.src).toContain("/sm/");
    expect(state?.maxWidth).toBe(228);
  });

  test("applies endpoint and display overrides", () => {
    const state = computeImageState(
      TEST_VISIONARY_CODE,
      {
        disableBlurLayer: true,
        endpoint: "https://cdn.test",
        size: ImageSizeToken.md,
      },
      0.5
    );

    expect(state?.src).toMatch(/^https:\/\/cdn\.test\//);
    expect(state?.backgroundColor).toBe("rgba(114,97,90,0.5)");
    expect(state?.maxWidth).toBe(455);
    expect(state?.pixels).toBeUndefined();
  });

  test.each(["", "not_a_url", "https://example.test/image.jpg"])(
    "returns null for non-Visionary input %j",
    (input) => {
      expect(computeImageState(input)).toBeNull();
    }
  );
});
