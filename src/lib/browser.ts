import { decodeWithCache } from "./cache";
import { BG_ALPHA, BLURHASH_PUNCH, CANVAS_SIZE } from "./constants";
import { logDebug, logWarn } from "./logger";
import { computeImageState } from "./state";
import {
  buildCanvasStyle,
  buildContainerStyle,
  buildImageStyle,
} from "../style";
import type { InitOptions } from "../type";
import { createUrl } from "./util";

/** Data attribute marking an element as a Visionary image container */
const ATTR_VISIONARY = "data-visionary";
/** Shared ownership marker across React and JS renderers */
const ATTR_OWNER = "data-v7y";
/** Data attribute opting an image out of decorating */
const ATTR_SKIP = "data-visionary-skip";

/** Images are decorated unless the caller narrows this */
const DEFAULT_TARGET = "img";

/**
 * Cache of each image's last examined src. Tracked off-DOM so repeated observer
 * passes don't re-parse unchanged URLs, and so pages full of ordinary images
 * aren't littered with marker attributes.
 */
const examinedImages = new WeakMap<HTMLImageElement, string>();
const paintedContainerSources = new WeakMap<Element, string>();

/** Invalid `target` selectors already logged */
const warnedTargets = new Set<string>();

interface ResolvedOptions {
  bgColorAlpha: number;
  canvasSize: number;
  debug: boolean;
  endpoint?: string;
  punch: number;
  target: string;
  eagerCanvasPaint: boolean;
}

const resolveOptions = (options: InitOptions): ResolvedOptions => ({
  bgColorAlpha: options.bgColorAlpha ?? BG_ALPHA,
  canvasSize: options.canvasSize ?? CANVAS_SIZE,
  debug: options.debug ?? false,
  endpoint: options.endpoint,
  punch: options.punch ?? BLURHASH_PUNCH,
  target: options.target ?? DEFAULT_TARGET,
  eagerCanvasPaint: options.eagerCanvasPaint ?? false,
});

/**
 * Paint the collected containers, either synchronously (for first-paint
 * reliability) or batched into the next frame.
 */
const paintPending = (pending: Element[], options: ResolvedOptions): void => {
  if (pending.length === 0) {
    return;
  }
  const paint = () =>
    pending.forEach((element) => initElement(element, options));
  if (options.eagerCanvasPaint) {
    paint();
  } else {
    requestAnimationFrame(paint);
  }
};

/** `document.body` is null when the script runs from `<head>` */
const resolveRoot = (root?: Element): Element =>
  root ?? document.body ?? document.documentElement;

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
  if (!pixels) {
    if (debug) {
      logWarn("Could not decode blurhash:", hash);
    }
    return;
  }

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

const getImageSource = (image: HTMLImageElement): string | null => {
  const srcAttr = image.getAttribute("src");
  if (!srcAttr) {
    return null;
  }
  return image.src || srcAttr;
};

const getContainerImageSource = (container: Element): string | null => {
  const image = container.querySelector("img") as HTMLImageElement | null;
  if (!image) {
    return null;
  }
  return getImageSource(image);
};

/**
 * Check if a container should be painted based on its image source
 */
const shouldPaintContainer = (container: Element): boolean => {
  const src = getContainerImageSource(container);
  if (!src) {
    return false;
  }
  return paintedContainerSources.get(container) !== src;
};

/**
 * Initialize a single Visionary image element.
 * Finds the canvas within the element and renders the blurhash.
 */
const initElement = (element: Element, options: ResolvedOptions): void => {
  const { bgColorAlpha, canvasSize, debug, endpoint, punch } = options;

  const canvas = element.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    if (debug) {
      logWarn("Element missing canvas:", element);
    }
    return;
  }

  const imageSrc = getContainerImageSource(element);
  if (!imageSrc) {
    if (debug) {
      logWarn("Element missing image src:", element);
    }
    return;
  }

  if (paintedContainerSources.get(element) === imageSrc) {
    return;
  }

  const state = computeImageState(
    imageSrc,
    { debug, disableBlurLayer: true, endpoint },
    bgColorAlpha,
    punch
  );
  if (!state?.blurhash) {
    if (debug) {
      logWarn("blurhash data not found in URL:", imageSrc);
    }
    return;
  }

  // Render blurhash to canvas
  renderToCanvas(canvas, state.blurhash, canvasSize, punch, debug);
  // Mark container as initialized
  element.setAttribute(ATTR_OWNER, "");
  paintedContainerSources.set(element, imageSrc);

  if (debug) {
    logDebug("Element initialized", element);
  }
};

/**
 * Find candidate images to check for Blurhash URLs.
 * By default, only `IMG` nodes are considered candidates.
 */
const collectCandidateImages = (
  root: Element,
  target: string
): HTMLImageElement[] => {
  const images = new Set<HTMLImageElement>();
  try {
    if (root.tagName === "IMG" && root.matches(target)) {
      images.add(root as HTMLImageElement);
    }
    root.querySelectorAll(target).forEach((element) => {
      if (element.tagName === "IMG") {
        images.add(element as HTMLImageElement);
      }
    });
  } catch {
    if (!warnedTargets.has(target)) {
      warnedTargets.add(target);
      logWarn("`target` selector is invalid", target);
    }
  }

  return Array.from(images);
};

/**
 * Decorate a bare `<img>` whose `src` carries a Visionary Code into a layered Visionary container that
 * `renderVisionaryHTML` renders. The author's `src` and `loading` attributes are preserved. The image
 * request is already in flight when this runs.
 *
 * @returns The container awaiting a blurhash paint, or null if there's nothing to paint
 */
const decorateImage = (
  image: HTMLImageElement,
  options: ResolvedOptions
): Element | null => {
  const { bgColorAlpha, canvasSize, debug, endpoint, punch } = options;
  const srcAttr = image.getAttribute("src");
  if (!srcAttr) {
    return null;
  }
  const normalizedSrc = image.src || srcAttr;
  const lastExaminedSrc = examinedImages.get(image);
  if (lastExaminedSrc === normalizedSrc) {
    return null;
  }
  examinedImages.set(image, normalizedSrc);

  if (image.hasAttribute(ATTR_SKIP)) {
    return null;
  }

  // Omit images already processed or owned by another renderer
  if (
    image.parentElement?.closest(`[${ATTR_OWNER}]`) ||
    image.parentElement?.closest(`[${ATTR_VISIONARY}]`)
  ) {
    return null;
  }

  // Blurhash URL must start with `/image/`
  const srcUrl = createUrl(normalizedSrc);
  if (!srcUrl?.pathname.startsWith("/image/")) {
    return null;
  }

  const state = computeImageState(
    normalizedSrc,
    { debug, disableBlurLayer: true, endpoint },
    bgColorAlpha,
    punch
  );

  if (!state) {
    if (debug) {
      logDebug("No Blurhash URL data in src:", image.src);
    }
    return null;
  }

  const container = document.createElement("div");
  container.setAttribute(ATTR_OWNER, "");
  container.setAttribute(ATTR_VISIONARY, "");
  container.setAttribute("style", buildContainerStyle(state));
  image.before(container);

  if (state.blurhash) {
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.setAttribute("style", buildCanvasStyle());
    container.append(canvas);
  }

  const authorStyle = image.getAttribute("style");
  image.setAttribute(
    "style",
    [authorStyle, buildImageStyle()].filter(Boolean).join("; ")
  );
  container.append(image);

  if (debug) {
    logDebug("Image decorated", container);
  }

  // Without a blurhash the container still reserves the layout box and paints the background layer
  if (!state.blurhash) {
    paintedContainerSources.set(container, normalizedSrc);
    return null;
  }

  return container;
};

/**
 * Collect containers awaiting a blurhash paint from `node` and its descendants
 */
const collectPending = (node: Element, options: ResolvedOptions): Element[] => {
  const pending: Element[] = [];
  const containers = new Set<Element>();

  if (node.hasAttribute(ATTR_VISIONARY)) {
    containers.add(node);
  }
  node
    .querySelectorAll(`[${ATTR_VISIONARY}]`)
    .forEach((element) => containers.add(element));

  const closestContainer = node.closest(`[${ATTR_VISIONARY}]`);
  if (closestContainer) {
    containers.add(closestContainer);
  }

  containers.forEach((element) => {
    // Only non-image nodes are valid SSR containers, only when the source changed since the last paint
    if (element.tagName !== "IMG" && shouldPaintContainer(element)) {
      pending.push(element);
    }
  });

  collectCandidateImages(node, options.target).forEach((image) => {
    const container = decorateImage(image, options);
    if (container) {
      pending.push(container);
    }
  });

  return pending;
};

/**
 * Initialize all Visionary images within a root element.
 * Enhances images with a Blurhash URL `src` into a layered image placeholder.
 *
 * @param options - Configuration options
 * @returns Number of elements initialized
 */
export const initVisionaryImages = (options: InitOptions = {}): number => {
  const resolved = resolveOptions(options);
  const root = resolveRoot(options.root);

  const pending = collectPending(root, resolved);

  if (pending.length === 0) {
    if (resolved.debug) {
      logDebug("No uninitialized elements found");
    }
    return 0;
  }

  paintPending(pending, resolved);

  if (resolved.debug) {
    logDebug(`Queued ${pending.length} elements for init`);
  }

  return pending.length;
};

/**
 * Create a MutationObserver that automatically initializes new Visionary images.
 *
 * @param options - Configuration options
 * @returns MutationObserver instance (call .disconnect() to stop observing)
 */
export const observeVisionaryImages = (
  options: InitOptions = {}
): MutationObserver => {
  const resolved = resolveOptions(options);
  const root = resolveRoot(options.root);

  // Initialize existing elements first
  initVisionaryImages({ ...options, root });

  const observer = new MutationObserver((mutations) => {
    const pending: Element[] = [];

    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.target instanceof Element
      ) {
        pending.push(...collectPending(mutation.target, resolved));
        return;
      }
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        pending.push(...collectPending(node, resolved));
      });
    });

    if (pending.length === 0) {
      return;
    }

    paintPending(pending, resolved);

    if (resolved.debug) {
      logDebug(`Initialized ${pending.length} newly added elements`);
    }
  });

  observer.observe(root, {
    attributeFilter: ["src"],
    attributes: true,
    childList: true,
    subtree: true,
  });

  if (resolved.debug) {
    logDebug("MutationObserver started");
  }

  return observer;
};
