/// <reference types="vitest" />

import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Main library build
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: (format) =>
        `visionary-image-js.${format === "es" ? "js" : "cjs"}`,
      formats: ["es", "cjs"],
      name: "VisionaryJS",
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
