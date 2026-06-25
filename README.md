# visionary-image-js

Framework-agnostic client-side enhancement for Visionary images with blurhash placeholders.

## Installation

```bash
npm install visionary-image-js
```

## Quick Start (Zero Config)

Just add the auto-init script to your HTML:

```html
<script src="https://unpkg.com/visionary-image-js/dist/visionary-autoload.js"></script>
```

That's it! The script auto-initializes all `[data-visionary]` elements on page load.

### Options via data attributes

```html
<!-- Enable debug logging -->
<script src="visionary-autoload.js" data-debug></script>

<!-- Auto-init new elements (for SPAs) -->
<script src="visionary-autoload.js" data-observe></script>

<!-- Both -->
<script src="visionary-autoload.js" data-debug data-observe></script>
```

## Usage

### HTML Structure

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

### Initialize on Page Load

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

// Start observing - initializes existing and future elements
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

### SSR Rendering (Hono, Express, etc.)

Generate HTML strings server-side:

```typescript
import { renderVisionaryHTML } from "visionary-image-js";

const visionaryUrl = "/image/aHR0cHM6Ly9...";

const { html, state } = renderVisionaryHTML(visionaryUrl, {
  alt: "My image",
});

// html is a complete <div data-visionary>...</div> string
// state contains parsed aspectRatio, backgroundColor, etc.
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

Parse a Visionary URL and compute image state (dimensions, background color, decoded pixels).

### `decodeWithCache(hash, size?, punch?)`

Decode a blurhash string to pixel data, using the global cache.

### `clearCache()`

Clear the global pixel cache.

## Global Cache

Decoded blurhash pixels are cached on `window.V7Y_PIXEL_CACHE`. This ensures:

- Same image on a page doesn't decode twice
- Cache is shared across multiple bundle copies
- Memory is managed by the browser

## License

ISC
