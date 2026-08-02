import type { BlurhashUrlFields, BlurhashUrlOptions } from "blurhash-url";
import type { ImageSizeToken } from "blurhash-url/constants";

export interface ImageState extends BlurhashUrlFields {
  /** Aspect ratio of the image as a percentage, applied as padding-top */
  arPaddingTop?: string;

  /** Aspect ratio of the image (width / height) */
  aspectRatio: number;

  /** Background color as rgba string */
  backgroundColor?: string;

  /** Maximum width in pixels */
  maxWidth: number;

  /** Decoded blurhash pixel data */
  pixels?: Uint8ClampedArray;

  /** Final image src URL */
  src: string;
}

export interface ImageStateConfig
  extends Pick<BlurhashUrlOptions, "debug" | "endpoint" | "size"> {
  /** Disable rendering of the blur (canvas) layer */
  disableBlurLayer?: boolean;
  /** Disable rendering of the image layer */
  disableImageLayer?: boolean;
  /** Hide the image layer via CSS (reveals blur layer underneath) */
  hideImageLayer?: boolean;
}

export interface InitOptions {
  /** Background color alpha channel (default: 0.7) */
  bgColorAlpha?: number;
  /** Canvas size for blurhash rendering (default: 24) */
  canvasSize?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom endpoint for image URLs */
  endpoint?: string;
  /** Blurhash punch parameter (default: 1) */
  punch?: number;
  /** Root element to search within (default: document.body) */
  root?: Element;
  /** CSS selector indicating which images to render as Visionary images (default: "img") */
  target?: string;
  /**
   * Paint blurhash canvases immediately in the current task instead of deferring paint work into
   * the next `requestAnimationFrame` (default: false).
   *
   * Useful for above-the-fold images where you want the blurhash placeholder to show up immediately */
  eagerCanvasPaint?: boolean;
}

export type { BlurhashUrlFields, BlurhashUrlOptions, ImageSizeToken };
