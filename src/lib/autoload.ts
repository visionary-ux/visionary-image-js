/**
 * Auto-initializing script for visionary-image-js.
 *
 * Usage:
 *   <script src="visionary-autoload.js"></script>
 *
 * Load this from `<head>` so images are decorated as the parser reaches them, before the browser
 * lays them out. Loading it any later still renders placeholders, but the layout shift it exists
 * to prevent has already happened.
 *
 * Attributes:
 *   data-debug          - Enable debug logging
 *   data-once           - Initialize once at DOM ready instead of observing
 *   data-eager-canvas   - Paint blurhash canvases synchronously instead of deferring to requestAnimationFrame
 *   data-target="..."   - CSS selector indicating which images to render as Visionary images (default: "img")
 */

import { initVisionaryImages, observeVisionaryImages } from "./browser";

// `document.currentScript` only resolves while the script is executing, so
// config has to be read here rather than inside a later callback
const scriptTag = document.currentScript as HTMLScriptElement | null;

const debug = scriptTag?.hasAttribute("data-debug") ?? false;
const once = scriptTag?.hasAttribute("data-once") ?? false;
const eagerCanvasPaint = scriptTag?.hasAttribute("data-eager-canvas") ?? false;
const target = scriptTag?.getAttribute("data-target") || undefined;
const options = { debug, eagerCanvasPaint, target };

if (debug) {
  console.log("[visionary-image-js] Auto-init with config:", {
    debug,
    eagerCanvasPaint,
    once,
    target,
  });
}

if (once) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      initVisionaryImages(options)
    );
  } else {
    initVisionaryImages(options);
  }
} else {
  // `document.body` may not exist yet when loaded from `<head>`
  observeVisionaryImages({ ...options, root: document.documentElement });
}
