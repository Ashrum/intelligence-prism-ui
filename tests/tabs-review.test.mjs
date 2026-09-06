import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("keeps the public Tabs API and semantics available to the candidate", async () => {
  const { Tabs, TabsContent, TabsList, TabsTrigger } = await vite.ssrLoadModule("/components/ui/tabs.tsx");
  const html = renderToStaticMarkup(
    React.createElement(
      Tabs,
      { value: "evidence", orientation: "vertical", dir: "rtl", activationMode: "manual" },
      React.createElement(
        TabsList,
        { "aria-label": "接口守恒" },
        React.createElement(TabsTrigger, { value: "overview" }, "概览"),
        React.createElement(TabsTrigger, { value: "evidence" }, "教育证据"),
        React.createElement(TabsTrigger, { value: "disabled", disabled: true }, "禁用"),
      ),
      React.createElement(TabsContent, { value: "overview", forceMount: true }, "概览内容"),
      React.createElement(TabsContent, { value: "evidence", forceMount: true }, "证据内容"),
    ),
  );

  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-orientation="vertical"/);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-controls=/);
  assert.match(html, /aria-labelledby=/);
});

test("keeps Segmented Control on true single-select radio semantics", async () => {
  const { RadioGroup, RadioGroupItem } = await vite.ssrLoadModule("/components/ui/radio-group.tsx");
  const html = renderToStaticMarkup(
    React.createElement(
      RadioGroup,
      { value: "student", orientation: "horizontal", dir: "rtl", "aria-label": "查看视角" },
      React.createElement(RadioGroupItem, { value: "student", "aria-label": "学生视角" }),
      React.createElement(RadioGroupItem, { value: "question", "aria-label": "题目视角" }),
      React.createElement(RadioGroupItem, { value: "disabled", disabled: true, "aria-label": "禁用视角" }),
    ),
  );

  assert.match(html, /role="radiogroup"/);
  assert.match(html, /aria-orientation="horizontal"/);
  assert.match(html, /dir="rtl"/);
  assert.equal((html.match(/role="radio"/g) ?? []).length, 3);
  assert.equal((html.match(/aria-checked="true"/g) ?? []).length, 1);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /role="tab"|role="tabpanel"/);
});

test("isolates moving indicators and their responsive motion contract", async () => {
  const [page, css, layout, formalTabs, benchmark, globals] = await Promise.all([
    readFile(new URL("../app/review/tabs/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/review/tabs/review.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/tabs.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/benchmark/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /ResizeObserver/);
  assert.match(page, /MutationObserver/);
  assert.match(page, /document\.fonts/);
  assert.match(page, /activationMode="manual"/);
  assert.match(page, /orientation="horizontal"/);
  assert.match(page, /data-review-scroll/);
  assert.equal((page.match(/<ReviewSection/g) ?? []).length, 3);
  assert.match(css, /180ms/);
  assert.match(css, /--review-control-height:\s*2\.25rem/);
  assert.match(css, /--review-control-height:\s*2rem/);
  assert.match(css, /--review-page-gap:\s*1\.5rem/);
  assert.match(css, /--review-page-gap:\s*1rem/);
  assert.match(css, /font-size:\s*\.875rem/);
  assert.match(css, /\.boundary\s*>\s*div:first-child\s*>\s*span/);
  assert.doesNotMatch(css, /\.boundary\s+span\s*\{/);
  assert.match(css, /\.pageTrigger:not\(:disabled\):not\(\[data-state="active"\]\):hover/);
  assert.match(css, /\.surfaceTrigger:not\(:disabled\):not\(\[data-state="active"\]\):hover/);
  assert.match(css, /\.currentPageTrack\s*\{[\s\S]*?height:\s*var\(--review-control-height\)[\s\S]*?gap:\s*var\(--review-page-gap\)/);
  assert.match(css, /\.currentSurfaceTrack\s*\{[\s\S]*?height:\s*var\(--review-control-height\)/);
  assert.match(css, /\.currentSegmentTrack\s*\{[\s\S]*?height:\s*var\(--review-control-height\)/);
  assert.doesNotMatch(css, /#[\da-f]{3,8}|rgba?\(/i);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /transition:\s*none\s*!important/);
  assert.match(layout, /href="\/review\/tabs"/);
  assert.doesNotMatch(formalTabs + benchmark + globals, /review\.module\.css|data-review-indicator|MovingTabs/);
});
