import autoloadSource from "synthetic:visionary-autoload";

/** Minified source of the autoload script (`visionary-autoload.js`) */
export const AUTOLOAD_SCRIPT: string = autoloadSource;

export interface AutoloadScriptOptions {
  /** Enable debug logging (`data-debug`) */
  debug?: boolean;
  /** Paint Blurhash canvases synchronously (`data-eager-canvas`), recommended for above-the-fold images */
  eagerCanvasPaint?: boolean;
  /** CSP nonce for the inline script */
  nonce?: string;
  /** Initialize once at DOM ready instead of observing for new images (`data-once`) */
  once?: boolean;
  /** CSS selector for images to decorate (`data-target`, default: "img") */
  target?: string;
}

const escapeAttr = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Render the autoload script as an inline `<script>` tag for your server-rendered `<head>`.
 * Inlining avoids a render-blocking request, so SSR placeholders paint as the parser reaches them.
 */
export const renderAutoloadScript = (
  options: AutoloadScriptOptions = {}
): string => {
  const { debug, eagerCanvasPaint, nonce, once, target } = options;
  const attrs = [
    nonce ? ` nonce="${escapeAttr(nonce)}"` : "",
    target ? ` data-target="${escapeAttr(target)}"` : "",
    eagerCanvasPaint ? " data-eager-canvas" : "",
    once ? " data-once" : "",
    debug ? " data-debug" : "",
  ].join("");

  return `<script${attrs}>${AUTOLOAD_SCRIPT}</script>`;
};
