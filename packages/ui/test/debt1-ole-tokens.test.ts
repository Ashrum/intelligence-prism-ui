import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const styles = new URL("../styles/", import.meta.url);
const coss = new URL("../src/coss/", import.meta.url);
const tokens = readFileSync(new URL("tokens.css", styles));
const registeredTokens = new Set(
  Array.from(tokens.toString().matchAll(/(^|\s)(--ole-[\w-]+)\s*:/g), ([, , name]) => name),
);
const legacyVariable = /\bvar\(\s*--(?:(?:background|foreground|card|popover|primary|secondary|muted|accent|border|input|ring|destructive|info|success|warning|chromatic|radius)(?:-[\w-]+)?|sidebar(?:-(?:foreground|primary|accent|border|ring)(?:-foreground)?)?)\s*[,)]/;

function assertRegisteredTokens(source: string, filename: string) {
  for (const [name] of source.matchAll(/--ole-[\w-]+/g)) {
    assert.ok(registeredTokens.has(name), `${filename} references unregistered token ${name}`);
  }
}

test("tokens.css keeps the v1.2.3 bytes across LF and CRLF checkouts", () => {
  const expected = [
    "93d8960a82bb8dd7b802d150dac3b3f950bec9c738155d2aa84ebd3602891366", // Git blob (LF)
    "67f67f1858827532516d922396857244fb39698c027b943ff2126a777a3f3f6e", // Windows checkout (CRLF)
  ];
  assert.ok(expected.includes(createHash("sha256").update(tokens).digest("hex")));
});

test("production and standalone themes share registered OLE utilities without a legacy bridge", () => {
  const workbench = readFileSync(new URL("theme-workbench.css", styles), "utf8");
  const standalone = readFileSync(new URL("theme.css", styles), "utf8");
  assert.match(standalone, /@import "\.\/theme-workbench\.css";/);
  for (const [name, source] of Object.entries({ workbench, standalone })) {
    assert.doesNotMatch(source, legacyVariable, name);
    assert.doesNotMatch(source, /\bvar\(\s*--sidebar[\w-]*\s*[,)]/, name);
    assert.doesNotMatch(source, /\bprism-light\b|@container\s+style\s*\(|@media[^{}]*\b(?:width|device-width)\b/i, name);
    assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|color)\(/i, name);
    assertRegisteredTokens(source, name);
  }
  const utilities = workbench.match(/@theme inline\s*\{([^}]+)\}/)?.[1];
  assert.ok(utilities, "Workbench must declare inline theme utilities");
  for (const [, name, value] of utilities.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    const reference = /var\(--ole-[\w-]+\)/;
    if (name.startsWith("--animate-")) {
      assert.match(value, /var\(--ole-motion-duration-[\w-]+\)/, name);
      assert.match(value, /var\(--ole-motion-easing-standard\)/, name);
    } else {
      assert.match(value, new RegExp(`^${reference.source}$`), name);
    }
  }
  assert.match(workbench, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition-duration:\s*var\(--ole-motion-reduced-duration\)/);
});

test("COSS primitives have no prototype styling, numeric overlay layers or untokenized timing", () => {
  for (const filename of readdirSync(coss).filter(name => name.endsWith(".tsx"))) {
    const source = readFileSync(new URL(filename, coss), "utf8");
    assert.doesNotMatch(source, legacyVariable, filename);
    assert.doesNotMatch(source, /prism-light:|before:shadow-\[|inset-shadow-\[/, filename);
    assert.doesNotMatch(source, /\bz-(?:40|50|60|70)\b/, filename);
    assert.doesNotMatch(source, /\b(?:duration|delay)-\d+\b|\bease-(?:in|out|in-out|linear)\b|\[transition:/, filename);
    assertRegisteredTokens(source, filename);
  }
});
