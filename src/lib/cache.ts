import { decodeBlurHash } from "fast-blurhash";

import { BLURHASH_PUNCH, CANVAS_SIZE } from "./constants";

declare global {
  interface Window {
    V7Y_PIXEL_CACHE?: Map<string, Uint8ClampedArray>;
  }
}

const ssrPixelCache = new Map<string, Uint8ClampedArray>();

/**
 * Get the global pixel cache, creating it if needed.
 * Cache is stored on window.V7Y_PIXEL_CACHE for cross-bundle sharing.
 */
export const getPixelCache = (): Map<string, Uint8ClampedArray> => {
  if (typeof window === "undefined") {
    return ssrPixelCache;
  }
  if (!window.V7Y_PIXEL_CACHE) {
    window.V7Y_PIXEL_CACHE = new Map();
  }
  return window.V7Y_PIXEL_CACHE;
};

/**
 * Generate a cache key for blurhash pixel data
 */
const getCacheKey = (hash: string, size: number, punch: number): string =>
  `${hash}:${size}:${punch}`;

/**
 * Decode blurhash to pixel data, using cache when available.
 * @param hash - Blurhash string
 * @param size - Canvas size (width and height)
 * @param punch - Blurhash punch parameter
 * @returns Pixel data as Uint8ClampedArray
 */
export const decodeWithCache = (
  hash: string,
  size: number = CANVAS_SIZE,
  punch: number = BLURHASH_PUNCH
): Uint8ClampedArray | null => {
  const cache = getPixelCache();
  const key = getCacheKey(hash, size, punch);

  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  try {
    const pixels = decodeBlurHash(hash, size, size, punch);
    cache.set(key, pixels);
    return pixels;
  } catch {
    return null;
  }
};

/**
 * Check if a blurhash is already cached
 */
export const isCached = (
  hash: string,
  size: number = CANVAS_SIZE,
  punch: number = BLURHASH_PUNCH
): boolean => {
  const cache = getPixelCache();
  return cache.has(getCacheKey(hash, size, punch));
};

/**
 * Clear the pixel cache
 */
export const clearCache = (): void => {
  if (typeof window === "undefined") {
    ssrPixelCache.clear();
  } else if (window.V7Y_PIXEL_CACHE) {
    window.V7Y_PIXEL_CACHE.clear();
  }
};
