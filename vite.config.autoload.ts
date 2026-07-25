import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

// Auto-init script build (IIFE for direct script tag usage)
export default defineConfig({
  build: {
    target: "es2015",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/lib/autoload.ts"),
      fileName: (format) =>
        `visionary-autoload.${format === "iife" ? "js" : "cjs"}`,
      formats: ["iife", "cjs"],
      name: "VisionaryAutoload",
    },
    outDir: "dist",
  },
  plugins: [
    dts({
      entryRoot: "src/lib",
      include: ["src/lib/autoload.ts"],
      outDirs: ["dist", { dir: "dist", moduleFormat: "cjs" }],
    }),
  ],
});
