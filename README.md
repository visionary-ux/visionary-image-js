# visionary-image-js

[![NPM version](https://img.shields.io/npm/v/visionary-image-js?color=beige)](https://www.npmjs.com/package/visionary-image-js) [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/visionary-ux/visionary-image-js/.github%2Fworkflows%2Fci-cd-workflow.yml?branch=master)](https://github.com/visionary-ux/visionary-image-js/actions) [![NPM bundle size](https://img.shields.io/bundlephobia/minzip/visionary-image-js?color=blue)](https://bundlephobia.com/package/visionary-image-js) [![NPM Downloads](https://img.shields.io/npm/d18m/visionary-image-js?color=lightgray)](https://www.npmjs.com/package/visionary-image-js?activeTab=versions)

Add Blurhash placeholders to any website. Point an `<img>` at a Blurhash URL, include the script, and the image gets a blur placeholder and a reserved layout box.

## Features

- **No markup changes:** Any `<img>` with a [Blurhash URL](https://github.com/visionary-ux/blurhash-url) in its `src` is automatically upgraded.
- **No layout shift:** Dimensions are read from the URL so space is reserved before page layout.
- **Works with dynamic pages:** New images and `src` updates are observed automatically (SPAs included).
- **Server rendering:** Generate the same markup server-side for Hono, Express, and friends.
- **Shared cache:** Each Blurhash is decoded once, even across multiple copies of the bundle.

## Installation

```bash
pnpm add visionary-image-js
npm install visionary-image-js
```

## Quick start

Load the script from `<head>` without `defer` or `async`. It decorates each image as the HTML parser reaches it. It can run later, but layout shift may have occured.

```html
<head>
  <script src="https://unpkg.com/visionary-image-js/dist/visionary-autoload.js"></script>
</head>
<body>
  <img
    src="https://blurhash.link/image/aW1nIzQyITk2MCE3MjAhODY5NmFjIUFVRlpULiVMX04lMQ/photo.jpg"
  />
</body>
```

Any `<img>` whose `src` is a Blurhash URL is wrapped and given a blur placeholder. Create Blurhash URLs with [Visionary URL Maker](https://visionary.cloud/url-maker) or the [`blurhash-url` package](https://github.com/visionary-ux/blurhash-url).

### Autoload options

| Attribute             | Effect                                                                   |
| --------------------- | ------------------------------------------------------------------------ |
| `data-target=".blur"` | Only decorate images matching this CSS selector (default: `img`)         |
| `data-eager-canvas`   | Paint Blurhash canvases synchronously (better for above-the-fold images) |
| `data-once`           | Initialize once at DOM ready instead of observing for new images         |
| `data-debug`          | Enable debug logging                                                     |

```html
<script
  src="https://unpkg.com/visionary-image-js/dist/visionary-autoload.js"
  data-target=".blur"
  data-eager-canvas
></script>
```

To opt-out an image, add the `data-visionary-skip` attribute on your `<img>` element.

## Usage

### Initialize manually

```typescript
import { initVisionaryImages } from "visionary-image-js";

initVisionaryImages();
```

### Watch for new images

For SPAs or pages that add images after load:

```typescript
import { observeVisionaryImages } from "visionary-image-js";

const observer = observeVisionaryImages();

// Later (like page transition, unmount)
observer.disconnect();
```

The autoload script uses `observeVisionaryImages` by default (unless `data-once` is set).

### Options

Both functions accept the same options:

```typescript
initVisionaryImages({
  bgColorAlpha: 0.7, // Background color opacity
  canvasSize: 24, // Blurhash canvas size
  debug: false, // Enable debug logging
  eagerCanvasPaint: true, // Paint synchronously instead of waiting for requestAnimationFrame
  endpoint: undefined, // Serve images from your own domain
  punch: 1, // Blurhash punch parameter
  root: document.body, // Element to search within
  target: "img", // CSS selector to target specific images
});
```

### SSR rendering

```typescript
import { renderVisionaryHTML } from "visionary-image-js";

const { html, state } = renderVisionaryHTML(blurhashUrl, {
  alt: "My image",
});

//  html → <div data-visionary /> container with a nested canvas and image element
// state → parsed values such as aspectRatio, backgroundColor, blurhash code
```

## API

### `initVisionaryImages(options?)`

Enhance matching `<img>` elements whose `src` is a Blurhash URL. Returns the number of elements queued. Images are wrapped immediately so layout is reserved; canvas painting is deferred via `requestAnimationFrame` unless `eagerCanvasPaint` is set.

### `observeVisionaryImages(options?)`

Same as above, plus a `MutationObserver` for images added later or whose `src` changes. Returns the observer so you can `disconnect()` it.

### `renderVisionaryHTML(src, options?)`

Render a Visionary image as an HTML string for SSR. Returns `{ html, state }`.

Options:

- `alt` — Image alt text
- `bgColorAlpha` — Background color opacity (default: `0.7`)
- `canvasSize` — Canvas dimensions (default: `24`)
- `className` — CSS class for the container
- `debug` — Enable debug logging
- `disableBlurLayer` — Omit the blur (canvas) layer
- `disableImageLayer` — Omit the image layer
- `endpoint` — Serve images from your own domain
- `hideImageLayer` — Hide the image via CSS (reveals the blur underneath)
- `loading` — `"lazy"` (default) or `"eager"`
- `size` — Override the size token from the Blurhash URL

### `computeImageState(src, options?)`

Parse a Blurhash URL and compute dimensions, background color, source, and (in the browser) decoded pixels.

### `decodeWithCache(hash, size?, punch?)`

Decode a Blurhash string to pixel data, using the global cache.

### `clearCache()`

Clear the global pixel cache.

## Global cache

In the browser, decoded Blurhash pixels are cached in `window.V7Y_PIXEL_CACHE`, so:

- The same image isn't decoded twice
- The cache is shared across multiple bundle copies
- You can empty it with `clearCache()`

## Related packages

| Package                                                              | Use for                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **`visionary-image-js`** (this package)                              | Zero-config `<script>` / CDN, or framework-agnostic SSR HTML       |
| [`visionary-image`](https://github.com/visionary-ux/visionary-image) | React apps (`<Image />`) and the `<visionary-image>` web component |

## License

ISC
