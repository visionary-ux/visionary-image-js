import {
  generateBlurhashUrl,
  isBase64UrlEncoded,
  parseVisionaryString,
} from "blurhash-url";
import { IMAGE_SIZES, ImageSizeToken } from "blurhash-url/constants";

import {
  BG_ALPHA,
  CANVAS_SIZE,
  DEFAULT_ENDPOINT,
  DEFAULT_IMAGE_SIZE,
} from "./constants";
import { logDebug } from "./logger";
import {
  buildCanvasStyle,
  buildContainerStyle,
  buildImageStyle,
} from "../style";
import {
  createUrl,
  generateRgbaString,
  getMaxEdgeLength,
  hexToRGB,
  round,
  swapUrlOrigin,
} from "./util";

/**
 * `blurhash-url` expects an absolute URL, so path-only inputs are parsed
 * against a temporary origin while preserving all supported option tokens.
 */
const parsePathOnlyBlurhashUrl = (input: string) => {
  if (!input.startsWith("/")) {
    return null;
  }

  try {
    const absoluteUrl = new URL(input, DEFAULT_ENDPOINT);
    return parseVisionaryString(absoluteUrl.toString());
  } catch {
    return null;
  }
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
  /** If specified, overrides the size specified in a Blurhash URL */
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
 * @param imageSrc - Blurhash URL or image src
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
  let blurhashUrlData = parseVisionaryString(src);

  if (debug) {
    logDebug("parseVisionaryString result:", blurhashUrlData);
  }

  // `blurhash-url` requires absolute URLs, so normalize path-only inputs.
  if (!blurhashUrlData) {
    blurhashUrlData = parsePathOnlyBlurhashUrl(src);
    if (debug) {
      logDebug("parsePathOnlyBlurhashUrl result:", blurhashUrlData);
    }
  }

  // Fallback for non-Blurhash URLs
  if (!blurhashUrlData) {
    if (debug) {
      logDebug("No Blurhash URL data found, using fallback img");
    }
    return {
      html: `<img src="${escapeHtml(src)}" alt="${escapeHtml(
        alt
      )}" loading="${loading}" />`,
      state: null,
    };
  }

  const { fields, options: urlOptions } = blurhashUrlData;

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
  let resolvedSrc: string;

  /** If the Visionary data `url` field is a valid URL, override the image src with it */
  const parsedUrlFromField = createUrl(fields.url);

  if (parsedUrlFromField) {
    resolvedSrc = parsedUrlFromField.toString();
  } else if (src.startsWith("/")) {
    // if src is a valid path-only URL, preserve it (including any serving option tokens)
    resolvedSrc = src;
  } else if (!createUrl(src) && isBase64UrlEncoded(fields.url)) {
    // If src is a Visionary Code and the `url` is a file ID, generate a URL
    const generatedUrl = generateBlurhashUrl(fields, {
      endpoint,
      size: imageSize,
    });
    resolvedSrc = generatedUrl ?? src;
  } else {
    // Default fallback
    resolvedSrc = src;
  }
  /** If an endpoint is specified, update the origin accordingly */
  if (endpoint) {
    const endpointUrl = createUrl(endpoint);
    resolvedSrc =
      resolvedSrc.startsWith("/") && endpointUrl
        ? new URL(resolvedSrc, endpointUrl).toString()
        : swapUrlOrigin(resolvedSrc, endpoint);
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
  const containerStyle = buildContainerStyle(state);
  const canvasStyle = buildCanvasStyle();
  const imgStyle = buildImageStyle(hideImageLayer);

  const classAttr = className ? ` class="${escapeHtml(className)}"` : "";

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

  const html = `<div data-visionary${classAttr} style="${containerStyle}" data-v7y>${canvasHtml}${imgHtml}</div>`;

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
