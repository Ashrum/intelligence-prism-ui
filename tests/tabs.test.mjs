import assert from "node:assert/strict";
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

test("preserves controlled Tabs, orientation, direction, disabled options and panel relationships", async () => {
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

test("publishes Segmented Control as a named single-select group with disabled options", async () => {
  const { SegmentedControl } = await vite.ssrLoadModule("/components/ui/segmented-control.tsx");
  const html = renderToStaticMarkup(React.createElement(SegmentedControl, {
    label: "证据视角", value: "question", orientation: "horizontal", dir: "rtl",
    items: [
      ["student", "学生视角"],
      { value: "question", label: "题目视角", count: 128 },
      { value: "disabled", label: "班级视角", disabled: true },
    ],
  }));
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /aria-label="证据视角"/);
  assert.match(html, /aria-orientation="horizontal"/);
  assert.match(html, /dir="rtl"/);
  assert.equal((html.match(/role="radio"/g) ?? []).length, 3);
  assert.equal((html.match(/aria-checked="true"/g) ?? []).length, 1);
  assert.match(html, /aria-label="题目视角 128"/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /role="tab"|role="tabpanel"/);
});

test("keeps TabsList asChild and uncontrolled Segmented selection usable", async () => {
  const { Tabs, TabsList, TabsTrigger, TabsContent } = await vite.ssrLoadModule("/components/ui/tabs.tsx");
  const { SegmentedControl } = await vite.ssrLoadModule("/components/ui/segmented-control.tsx");
  const tabsHtml = renderToStaticMarkup(React.createElement(Tabs, { defaultValue: "one" },
    React.createElement(TabsList, { asChild: true, variant: "line", "aria-label": "自定义列表" },
      React.createElement("div", { "data-custom-list": "true" }, React.createElement(TabsTrigger, { value: "one" }, "选项"))),
    React.createElement(TabsContent, { value: "one" }, "面板")));
  assert.equal((tabsHtml.match(/role="tablist"/g) ?? []).length, 1);
  assert.match(tabsHtml, /data-custom-list="true"/);
  assert.match(tabsHtml, /role="tabpanel"/);
  const radioHtml = renderToStaticMarkup(React.createElement(SegmentedControl, {
    label: "非受控视角", defaultValue: "second", disabled: true,
    items: [["first", "第一项"], ["second", "第二项"]],
  }));
  assert.equal((radioHtml.match(/aria-checked="true"/g) ?? []).length, 1);
  const radios = radioHtml.match(/<button\b[^>]*role="radio"[^>]*>/g) ?? [];
  assert.equal(radios.length, 2);
  for (const radio of radios) assert.match(radio, /\sdisabled=""/);
});
