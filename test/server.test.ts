import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, test } from "vitest";

import { AUTOLOAD_SCRIPT, renderAutoloadScript } from "../src/server";

const renderScript = (html: string): HTMLScriptElement => {
  const template = document.createElement("template");
  template.innerHTML = html;
  const script = template.content.firstElementChild;
  if (!(script instanceof HTMLScriptElement)) {
    throw new Error("Expected a <script> element");
  }
  return script;
};

describe(renderAutoloadScript.name, () => {
  test("inlines the autoload IIFE without attributes by default", () => {
    const html = renderAutoloadScript();
    const script = renderScript(html);

    expect(AUTOLOAD_SCRIPT).toMatch(/^\(function\(\)\{/);
    expect(html).toBe(`<script>${AUTOLOAD_SCRIPT}</script>`);
    expect(script.getAttributeNames()).toEqual([]);
    expect(script.textContent).toBe(AUTOLOAD_SCRIPT);
  });

  test("maps options to autoload data attributes", () => {
    const script = renderScript(
      renderAutoloadScript({
        debug: true,
        eagerCanvasPaint: true,
        nonce: 'abc"123',
        once: true,
        target: ".blur",
      })
    );

    expect(script.getAttribute("nonce")).toBe('abc"123');
    expect(script.getAttribute("data-target")).toBe(".blur");
    expect(script.hasAttribute("data-eager-canvas")).toBe(true);
    expect(script.hasAttribute("data-once")).toBe(true);
    expect(script.hasAttribute("data-debug")).toBe(true);
  });

  test("matches the published autoload build when dist exists", () => {
    const distPath = resolve(__dirname, "../dist/visionary-autoload.js");
    let dist: string;
    try {
      dist = readFileSync(distPath, "utf8");
    } catch {
      return;
    }
    expect(AUTOLOAD_SCRIPT).toBe(dist.trim());
  });
});
