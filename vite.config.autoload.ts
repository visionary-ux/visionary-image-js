/// <reference types="vitest" />

import { resolve } from "path";
import { defineConfig } from "vite";

// Auto-init script build (IIFE for direct script tag usage)
export default defineConfig({
  build: {
    target: "es2015",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/lib/autoload.ts"),
      fileName: () => "visionary-autoload.js",
      formats: ["iife"],
      name: "VisionaryAutoload",
    },
    outDir: "dist",
  },
});
