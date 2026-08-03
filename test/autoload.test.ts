import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const browserMocks = vi.hoisted(() => ({
  initVisionaryImages: vi.fn(),
  observeVisionaryImages: vi.fn(),
}));

vi.mock("../src/lib/browser", () => browserMocks);

describe("browser autoload", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("observes the document immediately by default", async () => {
    const script = document.createElement("script");
    vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");

    await import("../src/lib/autoload");

    expect(browserMocks.observeVisionaryImages).toHaveBeenCalledWith({
      debug: false,
      eagerCanvasPaint: false,
      root: document.documentElement,
      target: undefined,
    });
    expect(browserMocks.initVisionaryImages).not.toHaveBeenCalled();
  });

  test("enables immediate canvas painting in data-eager-canvas mode", async () => {
    const script = document.createElement("script");
    script.setAttribute("data-eager-canvas", "");
    vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");

    await import("../src/lib/autoload");

    expect(browserMocks.observeVisionaryImages).toHaveBeenCalledWith({
      debug: false,
      eagerCanvasPaint: true,
      root: document.documentElement,
      target: undefined,
    });
  });

  test("reads debug and target attributes from the script tag", async () => {
    const script = document.createElement("script");
    script.setAttribute("data-debug", "");
    script.setAttribute("data-target", "main img");
    vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await import("../src/lib/autoload");

    expect(browserMocks.observeVisionaryImages).toHaveBeenCalledWith({
      debug: true,
      eagerCanvasPaint: false,
      root: document.documentElement,
      target: "main img",
    });
  });

  test("waits for DOMContentLoaded in data-once mode", async () => {
    const script = document.createElement("script");
    script.setAttribute("data-once", "");
    vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");

    await import("../src/lib/autoload");

    expect(browserMocks.initVisionaryImages).not.toHaveBeenCalled();

    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(browserMocks.initVisionaryImages).toHaveBeenCalledWith({
      debug: false,
      eagerCanvasPaint: false,
      target: undefined,
    });
    expect(browserMocks.observeVisionaryImages).not.toHaveBeenCalled();
  });

  test("initializes immediately in data-once mode when the DOM is ready", async () => {
    const script = document.createElement("script");
    script.setAttribute("data-once", "");
    vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");

    await import("../src/lib/autoload");

    expect(browserMocks.initVisionaryImages).toHaveBeenCalledWith({
      debug: false,
      eagerCanvasPaint: false,
      target: undefined,
    });
  });
});
