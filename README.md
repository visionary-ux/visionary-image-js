# visionary-image-js

[![NPM version](https://img.shields.io/npm/v/visionary-image-js?color=beige)](https://www.npmjs.com/package/visionary-image-js) [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/visionary-ux/visionary-image-js/.github%2Fworkflows%2Fci-cd-workflow.yml?branch=master)](https://github.com/visionary-ux/visionary-image-js/actions) [![NPM bundle size](https://img.shields.io/bundlephobia/minzip/visionary-image-js?color=blue)](https://bundlephobia.com/package/visionary-image-js) [![NPM Downloads](https://img.shields.io/npm/d18m/visionary-image-js?color=lightgray)](https://www.npmjs.com/package/visionary-image-js?activeTab=versions)

Add Blurhash placeholders to any website. Point an `<img>` at a Blurhash URL, include the script, and the image gets a blur placeholder and a reserved layout box.

## Features

- **No markup changes:** Any `<img>` containing a [Blurhash URL](https://github.com/visionary-ux/blurhash-url) in its `src` is enhanced automatically.
- **No layout shift:** Reads the image's dimensions from the URL and reserves the space before the page is laid out.
- **Works with dynamic pages:** New images and `src` updates are picked up automatically, so SPAs work too.
- **Server rendering:** Generate the same markup server-side for Hono, Express, and friends.
- **Shared cache:** Each Blurhash is decoded once, even across multiple copies of the bundle.

## Installation

```bash
npm install visionary-image-js
```

## Quick start

Add the script to your `<head>`.

An `<img /> element using a Blurhash URL will be automatically be converted into a Visionary Image.

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

> [!IMPORTANT]
> Load the script from `<head>` without `defer`. It decorates each image as the HTML parser reaches it — if it runs any later, you still get placeholders, but the layout shift it exists to prevent has already happened.

### Blurhash URL

Blurhash URLs contain image placeholder data such as dimensions, background color, and Blurhash code. Create one with the [Blurhash URL Maker](#) or [`blurhash-url` package](https://github.com/visionary-ux/blurhash-url).

### Autoload options

#### `target`

Target images matching a CSS selector.

```html
<script src=".../visionary-autoload.js" data-target=".special-image"></script>
```

#### `exclude`

Ensure images matching a CSS selector are not converted to a Visionary Image.

```html
<script src=".../visionary-autoload.js" data-target=".special-image"></script>
```

#### `debug`

Enable debug logging.

```html
<script src=".../visionary-autoload.js" data-debug></script>
```

#### `eager`

Paint Blurhash synchronously, better for above the fold images. Default: runs inside `requestAnimationFrame`.

```html
<!-- Paint canvases in the current task (critical above-the-fold placeholders) -->
<script src=".../visionary-autoload.js" data-eager-canvas></script>

<!-- Decorate once at DOM ready instead of watching for new images -->
<script src=".../visionary-autoload.js" data-once></script>
```

To specify images to target, use the data-tar

To exclude a single image, add `data-visionary-skip` to it.
`data-target` matches images directly (for example, `.visionary-image` on `<img>`).

## Usage

### Initialize manually

If you'd rather import the package than use the autoload script:

```typescript
import { initVisionaryImages } from "visionary-image-js";

initVisionaryImages();
```

### Watch for new images

For single-page apps, or any page that adds images after load:

```typescript
import { observeVisionaryImages } from "visionary-image-js";

const observer = observeVisionaryImages();

// Later, to stop watching:
observer.disconnect();
```

### Options

Both functions take the same options:

```typescript
initVisionaryImages({
  bgColorAlpha: 0.7, // Background color opacity
  canvasSize: 24, // Blurhash canvas size
  debug: false, // Enable debug logging
  eagerCanvasPaint: true, // Paint synchronously instead of waiting for requestAnimationFrame
  endpoint: undefined, // Serve images from your own domain
  punch: 1, // Blurhash punch parameter
  root: document.body, // Element to search within
  target: "img", // CSS selector indicating images to render as Visionary images
});
```

### SSR rendering (Hono, Express, etc.)

Generate HTML strings server-side:

```typescript
import { renderVisionaryHTML } from "visionary-image-js";

const blurhashUrl = "/image/aHR0cHM6Ly9...";

const { html, state } = renderVisionaryHTML(blurhashUrl, {
  alt: "My image",
});

// html is a complete <div data-visionary>...</div> string
// state contains parsed values such as aspectRatio and backgroundColor
```

## API

### `initVisionaryImages(options?)`

Enhance every matching `<img>` whose `src` carries a Blurhash URL. Returns the number of elements queued for initialization. Images are wrapped with a container div so layout is reserved right away. Canvas painting is deferred via `requestAnimationFrame` unless `eagerCanvasPaint` is enabled.

### `observeVisionaryImages(options?)`

Same as above, plus a `MutationObserver` that handles images added later and images whose `src` changes after initial load. Returns the observer so you can `disconnect()` it.

### `renderVisionaryHTML(src, options?)`

Render a Visionary image as an HTML string for SSR. Returns `{ html, state }`.

Options:

- `alt` - Image alt text
- `bgColorAlpha` - Background color opacity (default: 0.7)
- `canvasSize` - Canvas dimensions (default: 24)
- `className` - CSS class for container
- `loading` - "lazy" (default) or "eager"

### `computeImageState(src, options?)`

Parse a Blurhash URL and compute its dimensions, background color, source, and browser-side decoded pixels.

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
