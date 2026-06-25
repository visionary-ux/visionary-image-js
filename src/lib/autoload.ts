/**
 * Auto-initializing script for visionary-image-js.
 *
 * Usage:
 *   <script src="visionary-autoload.js"></script>
 *
 * Attributes:
 *   data-debug   - Enable debug logging
 *   data-observe - Use MutationObserver for SPAs (auto-init new elements)
 */

import { initVisionaryImages, observeVisionaryImages } from "./browser";

const init = () => {
  // Find our own script tag to read config from data attributes
  const scriptTag = document.currentScript as HTMLScriptElement | null;

  const debug = scriptTag?.hasAttribute("data-debug") ?? false;
  const observe = scriptTag?.hasAttribute("data-observe") ?? false;

  if (debug) {
    console.log("[visionary-image-js] Auto-init with config:", {
      debug,
      observe,
    });
  }

  if (observe) {
    // MutationObserver mode - watches for new elements
    observeVisionaryImages({ debug });
  } else {
    // One-time init
    initVisionaryImages({ debug });
  }
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  // DOM already loaded, init immediately
  init();
}
