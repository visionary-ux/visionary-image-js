/// <reference types="vitest" />

import { resolve } from "path";
import { defineConfig } from "vite";

// Auto-init script build (IIFE for direct script tag usage)
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/autoload.ts"),
      fileName: () => "visionary-autoload.js",
      formats: ["iife"],
      name: "VisionaryAutoload",
    },
    outDir: "dist",
  },
});
