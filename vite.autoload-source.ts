import { resolve } from "path";
import { build, type Plugin } from "vite";

const SYNTHETIC_ID = "synthetic:visionary-autoload";
const RESOLVED_ID = `\0${SYNTHETIC_ID}`;

/**
 * Exposes the minified autoload IIFE as a string module (`synthetic:visionary-autoload`),
 * built with the same settings as `vite.config.autoload.ts`.
 */
export const autoloadSource = (): Plugin => ({
  name: "visionary-autoload-source",
  resolveId: (id) => (id === SYNTHETIC_ID ? RESOLVED_ID : undefined),
  async load(id) {
    if (id !== RESOLVED_ID) {
      return;
    }
    const output = await build({
      configFile: false,
      logLevel: "silent",
      build: {
        target: "es2015",
        write: false,
        lib: {
          entry: resolve(__dirname, "src/lib/autoload.ts"),
          formats: ["iife"],
          name: "VisionaryAutoload",
        },
      },
    });
    const [result] = Array.isArray(output) ? output : [output];
    if (!("output" in result)) {
      throw new Error("Unexpected autoload build output");
    }
    const code = result.output[0].code.trim();
    // Inlined into a <script> tag by renderAutoloadScript
    if (/<\/script/i.test(code)) {
      throw new Error("Autoload source must not contain </script");
    }
    return `export default ${JSON.stringify(code)};`;
  },
});
