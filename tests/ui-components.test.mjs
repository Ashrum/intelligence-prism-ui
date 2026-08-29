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
  server: { middlewareMode: true },
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
  const { catalogItems, catalogStats, componentDocuments, foundationItems, internalModules } =
    await vite.ssrLoadModule("/components/prism/catalog.ts");

  assert.equal(foundationItems.length, 10);
  assert.equal(catalogStats.baseComponents, 56);
  assert.equal(catalogStats.extensions, 3);
  assert.equal(catalogStats.stable, 9);
  assert.equal(catalogStats.planned, 50);
  assert.equal(catalogStats.documentedPages, 6);
  assert.equal(catalogItems.length, 59);
  assert.equal(internalModules.length, 5);
  assert.equal(new Set(catalogItems.map((item) => item.id)).size, catalogItems.length);
  const catalogIds = new Set(catalogItems.map((item) => item.id));
  for (const document of Object.values(componentDocuments)) {
    for (const id of document.itemIds) assert.ok(catalogIds.has(id));
  }
});
