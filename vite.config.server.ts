import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

import { autoloadSource } from "./vite.autoload-source";

// Server helpers build (inlined autoload script)
export default defineConfig({
  build: {
    target: "es2015",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/server.ts"),
      fileName: (format) => `server.${format === "es" ? "js" : "cjs"}`,
      formats: ["es", "cjs"],
    },
    outDir: "dist",
  },
  plugins: [
    autoloadSource(),
    dts({
      entryRoot: "src",
      include: ["src/server.ts", "src/synthetic.d.ts"],
      outDirs: ["dist", { dir: "dist", moduleFormat: "cjs" }],
    }),
  ],
});
