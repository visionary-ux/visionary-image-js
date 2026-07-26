# visionary-image-js

[![NPM version](https://img.shields.io/npm/v/visionary-image-js?color=beige)](https://www.npmjs.com/package/visionary-image-js) [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/visionary-ux/visionary-image-js/.github%2Fworkflows%2Fci-cd-workflow.yml?branch=master)](https://github.com/visionary-ux/visionary-image-js/actions) [![NPM bundle size](https://img.shields.io/bundlephobia/minzip/visionary-image-js?color=blue)](https://bundlephobia.com/package/visionary-image-js) [![NPM Downloads](https://img.shields.io/npm/d18m/visionary-image-js?color=lightgray)](https://www.npmjs.com/package/visionary-image-js?activeTab=versions)

Framework-agnostic rendering and client-side enhancement for Visionary images with Blurhash placeholders.

## Installation

```bash
npm install visionary-image-js
```

## Quick start

Add the auto-initializing script to your HTML:

```html
<script src="https://unpkg.com/visionary-image-js/dist/visionary-autoload.js"></script>
```

The script initializes all `[data-visionary]` elements when the DOM is ready.

### Autoload options

Configure autoload behavior with attributes on the script:

```html
<!-- Enable debug logging -->
<script
  src="https://unpkg.com/visionary-image-js/dist/visionary-autoload.js"
  data-debug
></script>

<!-- Auto-init new elements (for SPAs) -->
<script
  src="https://unpkg.com/visionary-image-js/dist/visionary-autoload.js"
  data-observe
></script>
```

## Usage

### HTML structure

Render your images with `data-visionary` and `data-blurhash` attributes:

```html
<div
  data-visionary
  data-blurhash="LEHV6nWB2yk8pyo0adR*.7kCMdnj"
  style="aspect-ratio: 1.5; background-color: rgba(100, 120, 140, 0.7);"
>
  <canvas width="24" height="24"></canvas>
  <img src="https://example.com/image.jpg" loading="lazy" />
</div>
```

### Initialize on page load

```typescript
import { initVisionaryImages } from "visionary-image-js";

// Initialize all [data-visionary] elements
document.addEventListener("DOMContentLoaded", () => {
  initVisionaryImages();
});
```

### Auto-initialize for SPAs

For single-page applications where elements are dynamically added:

```typescript
import { observeVisionaryImages } from "visionary-image-js";

// Initialize existing elements and observe future additions
const observer = observeVisionaryImages();

// Later, to stop observing:
observer.disconnect();
```

### Options

```typescript
initVisionaryImages({
  root: document.body, // Element to search within
  canvasSize: 24, // Blurhash canvas size
  punch: 1, // Blurhash punch parameter
  debug: false, // Enable debug logging
});
```

### SSR rendering (Hono, Express, etc.)

Generate HTML strings server-side:

```typescript
import { renderVisionaryHTML } from "visionary-image-js";

const visionaryUrl = "/image/aHR0cHM6Ly9...";

const { html, state } = renderVisionaryHTML(visionaryUrl, {
  alt: "My image",
});

// html is a complete <div data-visionary>...</div> string
// state contains parsed values such as aspectRatio and backgroundColor
```

## API

### `initVisionaryImages(options?)`

Initialize all uninitialized Visionary elements. Uses `requestAnimationFrame` to batch canvas rendering.

### `observeVisionaryImages(options?)`

Returns a `MutationObserver` that automatically initializes new Visionary elements as they're added to the DOM.

### `renderVisionaryHTML(src, options?)`

Render a Visionary image as an HTML string for SSR. Returns `{ html, state }`.

Options:

- `alt` - Image alt text
- `bgColorAlpha` - Background color opacity (default: 0.7)
- `canvasSize` - Canvas dimensions (default: 24)
- `className` - CSS class for container
- `loading` - "lazy" (default) or "eager"

### `computeImageState(src, options?)`

Parse a Visionary URL and compute its dimensions, background color, source, and browser-side decoded pixels.

### `decodeWithCache(hash, size?, punch?)`

Decode a blurhash string to pixel data, using the global cache.

### `clearCache()`

Clear the global pixel cache.

## Global Cache

In the browser, decoded BlurHash pixels are cached on `window.V7Y_PIXEL_CACHE`. This ensures:

- The same image on a page isn't decoded twice
- Cache is shared across multiple bundle copies
- The cache can be explicitly emptied with `clearCache()`

## Related packages

| Package                                                              | Use for                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **`visionary-image-js`** (this package)                              | Zero-config `<script>` / CDN, or framework-agnostic SSR HTML       |
| [`visionary-image`](https://github.com/visionary-ux/visionary-image) | React apps (`<Image />`), or the `<visionary-image>` web component |

## License

ISC
