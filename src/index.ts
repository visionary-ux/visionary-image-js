// Core initialization functions
export { initVisionaryImages, observeVisionaryImages } from "./lib/browser";

// SSR rendering
export { renderVisionaryHTML } from "./lib/server-render";
export type { RenderOptions, RenderResult } from "./lib/server-render";

// State computation
export { computeImageState } from "./lib/state";

// Cache utilities
export {
  clearCache,
  decodeWithCache,
  getPixelCache,
  isCached,
} from "./lib/cache";

// Constants
export {
  BG_ALPHA,
  BLURHASH_PUNCH,
  CANVAS_SIZE,
  DEFAULT_IMAGE_SIZE,
  IS_SSR,
} from "./lib/constants";

// Utilities
export {
  createUrl,
  generateRgbaString,
  getMaxEdgeLength,
  hexToRGB,
  round,
  swapUrlOrigin,
} from "./lib/util";
export type { RGB } from "./lib/util";

// Styles (for custom implementations)
export { canvasStyles, containerStyles, imageStyles } from "./style";

// Types
export type {
  BlurhashUrlFields,
  BlurhashUrlOptions,
  ImageState,
  ImageStateConfig,
  InitOptions,
} from "./type";
