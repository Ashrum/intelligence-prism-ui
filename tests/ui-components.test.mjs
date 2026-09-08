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
  appType: "custom",
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
  assert.equal(catalogStats.stable, 7);
  assert.equal(catalogStats.review, 2);
  assert.equal(catalogStats.planned, 50);
  assert.equal(catalogStats.documentedPages, 6);
  assert.equal(catalogItems.length, 59);
  assert.equal(catalogStats.stable + catalogStats.review + catalogStats.planned, catalogItems.length);
  assert.equal(componentDocumentStatus("tabs"), "review");
  assert.equal(componentDocumentStatus("card"), "review");
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
  for (const [name, value] of [["action-primary", contrastPresets.current.action[0]], ["action-primary-soft", contrastPresets.current.action[1]], ["ai-fg", contrastPresets.current.ai[0]], ["ai-bg", contrastPresets.current.ai[1]], ["source-growth", contrastPresets.current.growth[0]]]) {
    assert.match(css.toLowerCase(), new RegExp(`--${name}: ${value.toLowerCase()};`));
  }
});
