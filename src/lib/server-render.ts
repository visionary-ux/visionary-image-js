import {
  generateVisionaryUrl,
  ImageSizeToken,
  isBase64UrlEncoded,
  parseVisionaryCode,
  parseVisionaryString,
} from "visionary-url";
import { IMAGE_SIZES } from "visionary-url/constants";

import { BG_ALPHA, CANVAS_SIZE, DEFAULT_IMAGE_SIZE } from "./constants";
import { logDebug } from "./logger";
import {
  createUrl,
  generateRgbaString,
  getMaxEdgeLength,
  hexToRGB,
  round,
  swapUrlOrigin,
} from "./util";

/**
 * Extract Visionary code from various URL formats:
 * - https://example.com/image/{code}/filename.jpg
 * - https://example.com/image/{code}/{options}/filename.jpg
 * - /image/{code}/filename.jpg
 * - /image/{code}/{options}/filename.jpg
 * - Just the code itself
 *
 * Valid formats for visionary-url:
 * - /image/[visionaryCode]/filename.ext
 * - /image/[visionaryCode]/[options]/filename.ext
 */
const extractVisionaryCode = (input: string): string | null => {
  // Trim whitespace from input
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  // Check if input is a full URL (has protocol)
  const hasProtocol = /^https?:\/\//i.test(trimmed);

  if (hasProtocol) {
    // Parse as full URL
    try {
      const url = new URL(trimmed);
      const segments = url.pathname.split("/").filter(Boolean);
      // Expected: ["image", code, ...] or [code, ...]
      const codeIndex = segments[0] === "image" ? 1 : 0;
      if (segments[codeIndex]) {
        return segments[codeIndex];
      }
    } catch {
      // Invalid URL
    }
  } else if (trimmed.startsWith("/")) {
    // Path format: /image/{code}/filename or /image/{code}/{options}/filename
    const segments = trimmed.split("/").filter(Boolean);
    // Expected: ["image", code, filename] or ["image", code, options, filename]
    if (segments[0] === "image" && segments[1]) {
      return segments[1];
    }
    // Fallback: first segment after leading slash
    if (segments[0]) {
      return segments[0];
    }
  }

  // Return as-is (might be just the code)
  return trimmed;
};

export interface RenderOptions {
  /** Alt text for the image */
  alt?: string;
  /** Background color alpha (default: 0.7) */
  bgColorAlpha?: number;
  /** Canvas size (default: 24) */
  canvasSize?: number;
  /** Additional CSS class for the container */
  className?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Disable rendering of the blur (canvas) layer */
  disableBlurLayer?: boolean;
  /** Disable rendering of the image layer */
  disableImageLayer?: boolean;
  /** Custom endpoint for image URLs */
  endpoint?: string;
  /** Hide the image layer via CSS (reveals blur layer underneath) */
  hideImageLayer?: boolean;
  /** Image loading attribute (default: "lazy") */
  loading?: "lazy" | "eager";
  /** If specified, overrides the size specified in a Visionary URL */
  size?: ImageSizeToken;
}

export interface RenderResult {
  /** Rendered HTML string */
  html: string;
  /** Parsed image state (for custom rendering) */
  state: {
    arPaddingTop: string;
    aspectRatio: number;
    backgroundColor: string | null;
    blurhash: string | null;
    maxWidth: number;
    src: string;
  } | null;
}

/**
 * Render a Visionary image as an HTML string for SSR.
 * Outputs a div with data attributes, a canvas, and an img tag.
 *
 * @param imageSrc - Visionary URL or image src
 * @param options - Render options
 * @returns HTML string and parsed state
 */
export const renderVisionaryHTML = (
  imageSrc: string,
  options: RenderOptions = {}
): RenderResult => {
  const {
    alt = "",
    bgColorAlpha = BG_ALPHA,
    canvasSize = CANVAS_SIZE,
    className = "",
    debug = false,
    disableBlurLayer = false,
    disableImageLayer = false,
    endpoint,
    hideImageLayer = false,
    loading = "lazy",
    size: userSize,
  } = options;

  // Trim whitespace from input
  const src = imageSrc?.trim() ?? "";

  if (debug) {
    logDebug("render input:", src);
  }

  if (!src) {
    return {
      html: `<img src="" alt="${escapeHtml(alt)}" />`,
      state: null,
    };
  }

  // Try to parse directly first
  let visionaryData = parseVisionaryString(src);

  if (debug) {
    logDebug("parseVisionaryString result:", visionaryData);
  }

  // If that fails, try extracting code from URL path
  if (!visionaryData) {
    const code = extractVisionaryCode(src);
    if (debug) {
      logDebug("extractVisionaryCode result:", code);
    }
    if (code) {
      const fields = parseVisionaryCode(code);
      if (debug) {
        logDebug("parseVisionaryCode result:", fields);
      }
      if (fields) {
        visionaryData = { fields, options: {} };
      }
    }
  }

  // Fallback for non-Visionary URLs
  if (!visionaryData) {
    if (debug) {
      logDebug("No visionary data found, using fallback img");
    }
    return {
      html: `<img src="${escapeHtml(src)}" alt="${escapeHtml(
        alt
      )}" loading="${loading}" />`,
      state: null,
    };
  }

  const { fields, options: urlOptions } = visionaryData;

  if (fields.sourceWidth < 1 || fields.sourceHeight < 1) {
    return {
      html: `<img src="${escapeHtml(src)}" alt="${escapeHtml(
        alt
      )}" loading="${loading}" />`,
      state: null,
    };
  }

  // Calculate dimensions
  const sourceAspectRatio = fields.sourceWidth / fields.sourceHeight;
  const imageSize: ImageSizeToken =
    userSize ?? urlOptions.size ?? DEFAULT_IMAGE_SIZE;
  const size = IMAGE_SIZES[imageSize];

  let maxEdgeLength = 0,
    maxWidth = 0,
    resizedAspectRatio = 0;

  /** 'Landscape' aspect ratio (width >= height) */
  if (sourceAspectRatio >= 1) {
    maxWidth = maxEdgeLength = getMaxEdgeLength(size, fields.sourceWidth);
    const height = round(maxWidth / sourceAspectRatio);
    resizedAspectRatio = round(maxWidth / height, 6);
  } else {
    /** 'Portrait' aspect ratio (height > width) */
    maxEdgeLength = getMaxEdgeLength(size, fields.sourceHeight);
    maxWidth = round(maxEdgeLength * sourceAspectRatio);
    resizedAspectRatio = round(maxWidth / maxEdgeLength, 6);
  }

  const arPercentage = round(100 / resizedAspectRatio, 6);
  const arPaddingTop = `${arPercentage}%`;

  // Resolve the image src
  let resolvedSrc = src;

  /** Override src if Visionary field `url` is a URL */
  const urlFieldAsURL = createUrl(fields.url);
  if (urlFieldAsURL) {
    resolvedSrc = urlFieldAsURL.toString();
  }
  // if `src` isn't a URL and `url` field is a file ID, generate a URL
  else if (!createUrl(src) && isBase64UrlEncoded(fields.url)) {
    const generatedUrl = generateVisionaryUrl(fields, {
      endpoint,
      size: imageSize,
    });
    if (generatedUrl) {
      resolvedSrc = generatedUrl;
    }
  }
  if (endpoint) {
    resolvedSrc = swapUrlOrigin(resolvedSrc, endpoint);
  }

  if (debug) {
    logDebug("fields.url:", fields.url);
    logDebug("resolvedSrc:", resolvedSrc);
  }

  // Compute background color
  const rgb = fields.bcc ? hexToRGB(fields.bcc) : null;
  const backgroundColor = rgb ? generateRgbaString(rgb, bgColorAlpha) : null;

  const state = {
    arPaddingTop,
    aspectRatio: resizedAspectRatio,
    backgroundColor,
    blurhash: fields.blurhash ?? null,
    maxWidth,
    src: resolvedSrc,
  };

  // Build inline styles
  const containerStyle = [
    "position: relative",
    "width: 100%",
    `max-width: ${maxWidth}px`,
    `aspect-ratio: ${resizedAspectRatio}`,
    backgroundColor ? `background-color: ${backgroundColor}` : "",
    "overflow: hidden",
  ]
    .filter(Boolean)
    .join("; ");

  const canvasStyle = [
    "position: absolute",
    "top: 0",
    "left: 0",
    "width: 100%",
    "height: 100%",
    "object-fit: cover",
  ].join("; ");

  const imgStyle = [
    "position: absolute",
    "top: 0",
    "left: 0",
    "width: 100%",
    "height: 100%",
    "object-fit: cover",
    hideImageLayer ? "display: none" : "",
  ]
    .filter(Boolean)
    .join("; ");

  const classAttr = className ? ` class="${escapeHtml(className)}"` : "";
  const blurhashAttr =
    fields.blurhash && !disableBlurLayer
      ? ` data-blurhash="${escapeHtml(fields.blurhash)}"`
      : "";

  // Build canvas element (unless disabled)
  const canvasHtml = disableBlurLayer
    ? ""
    : `<canvas width="${canvasSize}" height="${canvasSize}" style="${canvasStyle}"></canvas>`;

  // Build img element (unless disabled)
  const imgHtml = disableImageLayer
    ? ""
    : `<img src="${escapeHtml(resolvedSrc)}" alt="${escapeHtml(
        alt
      )}" loading="${loading}" style="${imgStyle}" />`;

  const html = `<div data-visionary${blurhashAttr}${classAttr} style="${containerStyle}">${canvasHtml}${imgHtml}</div>`;

  return { html, state };
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
