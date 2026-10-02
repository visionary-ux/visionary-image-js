import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { configDefaults, defineConfig } from "vitest/config";

import { autoloadSource } from "./vite.autoload-source";

// Main library build
export default defineConfig({
  build: {
    target: "es2015",
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
    autoloadSource(),
    dts({
      bundleTypes: true,
      outDirs: ["dist", { dir: "dist", moduleFormat: "cjs" }],
    }),
  ],
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "test/browser/**", "test/worker/**"],
    globals: true,
  },
});
