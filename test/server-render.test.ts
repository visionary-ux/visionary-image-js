import { describe, expect, test } from "vitest";

import { renderVisionaryHTML } from "../src/lib/server-render";
import { TEST_VISIONARY_CODE, TEST_VISIONARY_URL } from "./fixtures";

const renderElement = (html: string): Element => {
  document.body.innerHTML = html;
  const element = document.body.firstElementChild;
  if (!element) {
    throw new Error("Expected rendered HTML");
  }
  return element;
};

describe(renderVisionaryHTML.name, () => {
  test("renders a Blurhash URL with its state and layers", () => {
    const result = renderVisionaryHTML(TEST_VISIONARY_URL, {
      alt: "A test image",
      className: "hero",
    });
    const container = renderElement(result.html);
    const canvas = container.querySelector("canvas");
    const image = container.querySelector("img");

    expect(result.state).toMatchObject({
      backgroundColor: "rgba(114,97,90,0.7)",
      maxWidth: 228,
      src: TEST_VISIONARY_URL,
    });
    expect(container.hasAttribute("data-v7y")).toBe(true);
    expect(container.hasAttribute("data-visionary")).toBe(true);
    expect(container.classList.contains("hero")).toBe(true);
    expect(canvas?.getAttribute("width")).toBe("24");
    expect(canvas?.getAttribute("height")).toBe("24");
    expect(image?.getAttribute("src")).toBe(TEST_VISIONARY_URL);
    expect(image?.getAttribute("alt")).toBe("A test image");
    expect(image?.getAttribute("loading")).toBe("lazy");
  });

  test("renders standalone codes with a custom endpoint and options", () => {
    const result = renderVisionaryHTML(TEST_VISIONARY_CODE, {
      bgColorAlpha: 0.5,
      canvasSize: 16,
      endpoint: "https://cdn.test",
      loading: "eager",
    });
    const container = renderElement(result.html);

    expect(result.state?.src).toMatch(/^https:\/\/cdn\.test\//);
    expect(result.state?.backgroundColor).toBe("rgba(114,97,90,0.5)");
    expect(container.querySelector("canvas")?.getAttribute("width")).toBe("16");
    expect(container.querySelector("img")?.getAttribute("loading")).toBe(
      "eager"
    );
  });

  test.each([
    [`/image/${TEST_VISIONARY_CODE}/sm/image.jpg`, 228],
    [`/image/${TEST_VISIONARY_CODE}/download,sm,webp/image.png`, 228],
    [`/image/${TEST_VISIONARY_CODE}/image.avif`, 911],
  ])(
    "extracts Blurhash URL data from path-only URL %s",
    (path, expectedMaxWidth) => {
      const result = renderVisionaryHTML(path);
      const container = renderElement(result.html);

      expect(result.state).not.toBeNull();
      expect(result.state?.src).toBe(path);
      expect(result.state?.maxWidth).toBe(expectedMaxWidth);
      expect(container.hasAttribute("data-visionary")).toBe(true);
      expect(container.querySelector("img")?.getAttribute("src")).toBe(path);
    }
  );

  test("can disable or hide rendering layers", () => {
    const withoutBlur = renderElement(
      renderVisionaryHTML(TEST_VISIONARY_URL, {
        disableBlurLayer: true,
      }).html
    );
    expect(withoutBlur.querySelector("canvas")).toBeNull();

    const withoutImage = renderElement(
      renderVisionaryHTML(TEST_VISIONARY_URL, {
        disableImageLayer: true,
      }).html
    );
    expect(withoutImage.querySelector("img")).toBeNull();

    const hiddenImage = renderElement(
      renderVisionaryHTML(TEST_VISIONARY_URL, {
        hideImageLayer: true,
      }).html
    ).querySelector("img");
    expect(hiddenImage?.getAttribute("style")).toContain("display: none");
  });

  test("falls back to an escaped img for non-Blurhash URL input", () => {
    const result = renderVisionaryHTML(
      "https://example.test/photo.jpg?x=1&y=2",
      { alt: `A "quoted" image` }
    );

    expect(result.state).toBeNull();
    expect(result.html).toContain("x=1&amp;y=2");
    expect(result.html).toContain("A &quot;quoted&quot; image");
    expect(renderElement(result.html)).toBeInstanceOf(HTMLImageElement);
  });

  test("renders a minimal fallback for an empty source", () => {
    expect(renderVisionaryHTML("", { alt: "<empty>" })).toEqual({
      html: '<img src="" alt="&lt;empty&gt;" />',
      state: null,
    });
  });
});
