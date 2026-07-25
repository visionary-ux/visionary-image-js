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
  /** Canvas size for blurhash rendering (default: 24) */
  canvasSize?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Blurhash punch parameter (default: 1) */
  punch?: number;
  /** Root element to search within (default: document.body) */
  root?: Element;
}

export type { BlurhashUrlFields, BlurhashUrlOptions, ImageSizeToken };
