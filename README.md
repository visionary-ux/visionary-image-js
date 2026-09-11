# visionary-image-js

[![NPM version](https://img.shields.io/npm/v/visionary-image-js?color=beige)](https://www.npmjs.com/package/visionary-image-js) [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/visionary-ux/visionary-image-js/.github%2Fworkflows%2Fci-cd-workflow.yml?branch=master)](https://github.com/visionary-ux/visionary-image-js/actions) [![NPM bundle size](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fdeno.bundlejs.com%2F%3Fq%3Dvisionary-image-js&query=%24.size.size&label=bundle%20size&color=blue)](https://bundlejs.com/?q=visionary-image-js) [![NPM Downloads](https://img.shields.io/npm/d18m/visionary-image-js?color=lightgray)](https://www.npmjs.com/package/visionary-image-js?activeTab=versions)

Instant Blurhash placeholders for any website, with stable dimensions from first paint to prevent Cumulative Layout Shift (CLS) and improve [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Features

- **Easy Blurhash:** Add the script and give any `<img>` a [Blurhash URL](https://github.com/visionary-ux/blurhash-url). Visionary handles the rest.
- **Self-contained URLs:** [`blurhash-url`](https://github.com/visionary-ux/blurhash-url) carries all placeholder data with the image URL—no API or database schema changes required.
- **Layout stability:** Embedded dimensions preserve the image’s aspect ratio before it loads, preventing Cumulative Layout Shift (CLS).
- **Lightning-fast previews:** Placeholders can paint on the browser's Critical Rendering Path, at First Contentful Paint and before `DOMContentLoaded`.
- **Dynamic-page ready:** New images and `src` updates are observed automatically, including in SPAs.
- **Server rendering:** Generate the same markup server-side for Hono, Express, and similar frameworks.
- **Runtime coverage:** TypeScript-first and tested in Node.js, Chromium, and Cloudflare Workers, including SSR.
- **Search performance:** Enhance search ranking potential by improving Core Web Vitals scores.
  > "We highly recommend site owners achieve good Core Web Vitals for success with Search" — [Google Search Central](https://developers.google.com/search/docs/appearance/core-web-vitals)

### Lighthouse Performance

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://cdn.visionary.cloud/image/VGVpcWpoQkJrRCExNTY2ITM3OCEyYzNjMzQhTDEzSjB0dDdYNXQ3aGFheW9mYXlRQ2F5ZTpheQ/lg/core-web-vitals-100-dark.jpg" />
  <img src="https://cdn.visionary.cloud/image/OF9XODQ5OHJFdSE5OTYhMjIyIWY3ZmNmYSFMa1JwYXF4dW9meHVfTW9mZjZrQ3hialtheWpb/lg/core-web-vitals-100-light.jpg" alt="Example Lighthouse report showing scores of 100 across Performance, Accessibility, Best Practices, and SEO" width="640" />
</picture>

[See our PageSpeed Insights Report →](https://pagespeed.web.dev/analysis/https-visionary-cloud-gallery/eyfz76k2k6?form_factor=desktop)

Lighthouse filmstrip showing the three-layer load: background color → Blurhash → full image

![Lighthouse report loading stage filmstrip](https://github.com/user-attachments/assets/20fd15ad-6801-4105-b75d-bf12cc8c704e)

## Installation

```bash
pnpm add visionary-image-js
npm install visionary-image-js
```

## Quick start

Load the script from `<head>` without `defer` or `async`. It decorates each image as the HTML parser reaches it. It can run later, but you may experience layout shift.

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
