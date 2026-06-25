import { decodeWithCache } from "./cache";
import { BLURHASH_PUNCH, CANVAS_SIZE } from "./constants";
import { logDebug, logWarn } from "./logger";
import type { InitOptions } from "../type";

/** Data attribute marking an element as a Visionary image container */
const ATTR_VISIONARY = "data-visionary";
/** Data attribute marking an element as initialized */
const ATTR_INITIALIZED = "data-v7y-init";
/** Data attribute containing the blurhash string */
const ATTR_BLURHASH = "data-blurhash";

/**
 * Render blurhash pixels to a canvas element
 */
const renderToCanvas = (
  canvas: HTMLCanvasElement,
  hash: string,
  size: number,
  punch: number,
  debug: boolean
): void => {
  const pixels = decodeWithCache(hash, size, punch);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    if (debug) {
      logWarn("Could not get canvas 2d context");
    }
    return;
  }

  const imageData = ctx.createImageData(size, size);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Initialize a single Visionary image element.
 * Finds the canvas within the element and renders the blurhash.
 */
const initElement = (
  element: Element,
  options: Required<Omit<InitOptions, "root">>
): void => {
  const { canvasSize, debug, punch } = options;

  // Skip if already initialized
  if (element.hasAttribute(ATTR_INITIALIZED)) {
    return;
  }

  const hash = element.getAttribute(ATTR_BLURHASH);
  if (!hash) {
    if (debug) {
      logWarn("Element missing data-blurhash:", element);
    }
    return;
  }

  const canvas = element.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    if (debug) {
      logWarn("Element missing canvas:", element);
    }
    return;
  }

  // Render blurhash to canvas
  renderToCanvas(canvas, hash, canvasSize, punch, debug);

  // Mark as initialized
  element.setAttribute(ATTR_INITIALIZED, "true");

  if (debug) {
    logDebug("Initialized element:", element);
  }
};

/**
 * Initialize all Visionary image elements within a root element.
 * Uses requestAnimationFrame to batch canvas rendering.
 *
 * @param options - Configuration options
 * @returns Number of elements initialized
 */
export const initVisionaryImages = (options: InitOptions = {}): number => {
  const {
    canvasSize = CANVAS_SIZE,
    debug = false,
    punch = BLURHASH_PUNCH,
    root = document.body,
  } = options;

  const elements = root.querySelectorAll(
    `[${ATTR_VISIONARY}]:not([${ATTR_INITIALIZED}])`
  );

  if (elements.length === 0) {
    if (debug) {
      logDebug("No uninitialized elements found");
    }
    return 0;
  }

  const initOptions = { canvasSize, debug, punch };

  // Use requestAnimationFrame to batch rendering
  requestAnimationFrame(() => {
    elements.forEach((el) => initElement(el, initOptions));
  });

  if (debug) {
    logDebug(`Queued ${elements.length} elements for init`);
  }

  return elements.length;
};

/**
 * Create a MutationObserver that automatically initializes new Visionary elements.
 * Useful for SPAs where elements are dynamically added to the DOM.
 *
 * @param options - Configuration options
 * @returns MutationObserver instance (call .disconnect() to stop observing)
 */
export const observeVisionaryImages = (
  options: InitOptions = {}
): MutationObserver => {
  const {
    canvasSize = CANVAS_SIZE,
    debug = false,
    punch = BLURHASH_PUNCH,
    root = document.body,
  } = options;

  const initOptions = { canvasSize, debug, punch };

  // Initialize existing elements first
  initVisionaryImages(options);

  const observer = new MutationObserver((mutations) => {
    let hasNewElements = false;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;

        // Check if the added node itself is a Visionary element
        if (node.hasAttribute(ATTR_VISIONARY)) {
          requestAnimationFrame(() => initElement(node, initOptions));
          hasNewElements = true;
        }

        // Check descendants
        const descendants = node.querySelectorAll(
          `[${ATTR_VISIONARY}]:not([${ATTR_INITIALIZED}])`
        );
        if (descendants.length > 0) {
          requestAnimationFrame(() => {
            descendants.forEach((el) => initElement(el, initOptions));
          });
          hasNewElements = true;
        }
      });
    });

    if (debug && hasNewElements) {
      logDebug("Initialized dynamically added elements");
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
  });

  if (debug) {
    logDebug("MutationObserver started");
  }

  return observer;
};
