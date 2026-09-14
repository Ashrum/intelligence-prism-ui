import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom", cacheDir: "node_modules/.vite-test-ui-components",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});

after(async () => {
  await vite.close();
});

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return readCssTree(entryPath);
      }
      return entry.name.endsWith(".css") ? readFile(entryPath, "utf8") : "";
    }),
  );
  return contents.join("\n");
}

test("emits the component library's motion and scrolling foundations", async () => {
  const css = await readCssTree(path.join(root, "dist"));

  assert.match(css, /scrollbar-width:\s*thin/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /transition-duration:\s*\.01ms/);
});

test("forwards progress semantics to the primitive", async () => {
  const { Progress } = await vite.ssrLoadModule("/components/ui/progress.tsx");
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 37 }));

  assert.match(html, /aria-valuenow="37"/);
  assert.match(html, /aria-valuetext="37%"/);
  assert.match(html, /data-state="loading"/);
});

test("emits chart themes for the starter's media dark mode", async () => {
  const { ChartStyle } = await vite.ssrLoadModule("/components/ui/chart.tsx");
  const html = renderToStaticMarkup(
    React.createElement(ChartStyle, {
      id: "contract",
      config: {
        latency: { theme: { light: "#ffffff", dark: "#000000" } },
      },
    }),
  );

  assert.match(html, /\[data-chart=contract\]/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  assert.doesNotMatch(html, /\.dark/);
});

test("renders sidebar skeletons deterministically", async () => {
  const { SidebarMenuSkeleton } = await vite.ssrLoadModule(
    "/components/ui/sidebar.tsx",
  );
  const first = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));
  const second = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));

  assert.equal(first, second);
  assert.match(first, /--skeleton-width:70%/);
});

test("keeps one truthful catalog for Foundations and component maturity", async () => {
  const { catalogItems, catalogStats, componentDocuments, componentDocumentStatus, countCatalogItems, foundationItems, internalModules } =
    await vite.ssrLoadModule("/components/prism/catalog.ts");

  assert.equal(foundationItems.length, 10);
  assert.equal(catalogStats.baseComponents, 56);
  assert.equal(catalogStats.extensions, 3);
  assert.equal(catalogStats.stable, 10);
  assert.equal(catalogStats.review, 5);
  assert.equal(catalogStats.planned, 44);
  assert.equal(catalogStats.documentedPages, 9);
  assert.equal(catalogItems.length, 59);
  assert.equal(catalogStats.stable + catalogStats.review + catalogStats.planned, catalogItems.length);
  assert.equal(componentDocumentStatus("tabs"), "review");
  assert.equal(componentDocumentStatus("card"), "review");
  assert.equal(componentDocumentStatus("select"), "stable");
  assert.equal(componentDocumentStatus("dialog"), "stable");
  assert.equal(componentDocumentStatus("choice-controls"), "review");
  assert.equal(componentDocumentStatus("badge-labels"), "stable");
  assert.deepEqual(countCatalogItems([]), { stable: 0, review: 0, planned: 0 });
  assert.equal(internalModules.length, 5);
  assert.equal(new Set(catalogItems.map((item) => item.id)).size, catalogItems.length);
  const catalogIds = new Set(catalogItems.map((item) => item.id));
  for (const document of Object.values(componentDocuments)) {
    for (const id of document.itemIds) assert.ok(catalogIds.has(id));
  }
  for (const item of catalogItems) assert.equal(Boolean(item.href), item.status !== "planned");
});

test("associates select labels and errors with the required control and exposes disabled state", async () => {
  const { SelectionField } = await vite.ssrLoadModule("/components/prism/select-examples.tsx");
  const html = renderToStaticMarkup(React.createElement(SelectionField, { label: "Evidence", value: "", required: true, error: "Choose evidence." }));
  const trigger = html.match(/<button[^>]*role="combobox"[^>]*>/)?.[0];
  assert.ok(trigger);
  const id = trigger.match(/\sid="([^"]+)"/)?.[1];
  const describedBy = trigger.match(/aria-describedby="([^"]+)"/)?.[1];
  assert.ok(id && describedBy);
  assert.ok(html.includes(`for="${id}"`));
  assert.ok(html.includes(`id="${describedBy}"`));
  assert.match(trigger, /aria-required="true"/);
  assert.match(trigger, /aria-invalid="true"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /Choose evidence\./);
  const disabled = renderToStaticMarkup(React.createElement(SelectionField, { label: "Archive", value: "classroom", disabled: true, description: "Not available." }));
  assert.match(disabled.match(/<button[^>]*role="combobox"[^>]*>/)?.[0] || "", /disabled=""/);
  assert.match(disabled, /Not available\./);
});

test("preserves mixed checkbox, required radio and binary switch semantics in the shared choice examples", async () => {
  const { ChoiceCheckbox, ChoiceSwitch, ChoiceControlsExamples } = await vite.ssrLoadModule("/components/prism/choice-controls.tsx");
  const mixed = renderToStaticMarkup(React.createElement(ChoiceCheckbox, { checked: "indeterminate", "aria-label": "All evidence" }));
  assert.match(mixed, /role="checkbox"[^>]*aria-checked="mixed"/);
  const binary = renderToStaticMarkup(React.createElement(ChoiceSwitch, { checked: true, disabled: true, "aria-label": "Reading font" }));
  assert.match(binary, /role="switch"[^>]*aria-checked="true"/);
  assert.match(binary, /disabled=""/);
  const html = renderToStaticMarkup(React.createElement(ChoiceControlsExamples));
  assert.match(html, /role="radiogroup"[^>]*aria-required="true"/);
  assert.match(html, /部分选中/);
  assert.match(html, /全选只影响这三种可用类型/);
  assert.match(html, /hidden=""/);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.ok(ids.includes(id), `Missing control ${id}`);
  for (const [, references] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
    for (const id of references.split(" ")) assert.ok(ids.includes(id), `Missing description or controlled region ${id}`);
  }
});

test("calculates contrast without rounding away a failed text threshold", async () => {
  const { contrastRatio, contrastPresets } = await vite.ssrLoadModule("/lib/color-contrast.ts");
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
  assert.equal(contrastRatio("#123456", "#123456"), 1);
  assert.equal(contrastRatio("#000", "#FFFFFF"), null);
  assert.equal(contrastRatio("#00000080", "#FFFFFF"), null);
  assert.ok(contrastRatio("#777777", "#FFFFFF") < 4.5);
  assert.equal(contrastRatio("#070707", "#777777").toFixed(2), "4.50");
  assert.ok(contrastRatio("#070707", "#777777") < 4.5);
  assert.equal(contrastRatio("#242424", "#AEAEAE").toFixed(2), "7.00");
  assert.ok(contrastRatio("#242424", "#AEAEAE") < 7);
  assert.ok(contrastRatio("#E11D48", "#FFF1F2") < 4.5);
  assert.ok(contrastRatio(...contrastPresets.current.ai) > 9.38);
  assert.ok(contrastRatio(...contrastPresets.light.growth) < 7);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const [name, value] of [["primary-foreground", contrastPresets.current.action[0]], ["action-fill", contrastPresets.current.action[1]], ["ai-fg", contrastPresets.current.ai[0]], ["ai-bg", contrastPresets.current.ai[1]], ["source-growth", contrastPresets.current.growth[0]]]) {
    assert.match(css.toLowerCase(), new RegExp(`--${name}: ${value.toLowerCase()};`));
  }
});

test("renders the new component pages and focus sample across the production RSC boundary", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const environment = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  for (const [route, expected] of [["/components/select", "选择证据范围"], ["/components/dialog", "复核设置"], ["/components/choice-controls", "纳入的学习证据"], ["/foundations/accessibility", "a11y-focus-demo"]]) {
    const response = await worker.fetch(new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }), environment, context);
    assert.equal(response.status, 200, route);
    assert.ok((await response.text()).includes(expected), `${route} did not render its example`);
  }
});
