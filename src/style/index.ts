/**
 * Inline styles for Visionary image elements.
 * These are applied via JavaScript to avoid external CSS dependencies.
 */

export const containerStyles = {
  overflow: "hidden",
  position: "relative" as const,
  width: "100%",
};

export const canvasStyles = {
  height: "100%",
  left: "0",
  position: "absolute" as const,
  top: "0",
  width: "100%",
};

export const imageStyles = {
  height: "100%",
  left: "0",
  objectFit: "cover" as const,
  position: "absolute" as const,
  top: "0",
  width: "100%",
};

const absoluteFill = [
  "position: absolute",
  "top: 0",
  "left: 0",
  "width: 100%",
  "height: 100%",
];

/**
 * Inline style for the container that reserves the image's layout box.
 * Shared by the SSR renderer and the client-side decorator.
 */
export const buildContainerStyle = (state: {
  aspectRatio: number;
  backgroundColor?: string | null;
  maxWidth: number;
}): string =>
  [
    "position: relative",
    "width: 100%",
    `max-width: ${state.maxWidth}px`,
    `aspect-ratio: ${state.aspectRatio}`,
    state.backgroundColor ? `background-color: ${state.backgroundColor}` : "",
    "overflow: hidden",
  ]
    .filter(Boolean)
    .join("; ");

/** Style for the blurhash canvas */
export const buildCanvasStyle = (): string => absoluteFill.join("; ");

/** Style for the `<img>` layer stacked above the canvas */
export const buildImageStyle = (hidden = false): string =>
  (hidden
    ? [...absoluteFill, "object-fit: cover", "display: none"]
    : [...absoluteFill, "object-fit: cover"]
  ).join("; ");
