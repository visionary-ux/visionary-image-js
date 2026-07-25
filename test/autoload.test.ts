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

  test("initializes immediately when the DOM is ready", async () => {
    const script = document.createElement("script");
    vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");

    await import("../src/lib/autoload");

    expect(browserMocks.initVisionaryImages).toHaveBeenCalledWith({
      debug: false,
    });
    expect(browserMocks.observeVisionaryImages).not.toHaveBeenCalled();
  });

  test("waits for DOMContentLoaded and enables observation attributes", async () => {
    const script = document.createElement("script");
    script.setAttribute("data-debug", "");
    script.setAttribute("data-observe", "");
    vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await import("../src/lib/autoload");

    expect(browserMocks.observeVisionaryImages).not.toHaveBeenCalled();

    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(browserMocks.observeVisionaryImages).toHaveBeenCalledWith({
      debug: true,
    });
    expect(browserMocks.initVisionaryImages).not.toHaveBeenCalled();
  });
});
