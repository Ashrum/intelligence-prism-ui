import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom", configFile: false, root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});
after(() => vite.close());
const { Button, buttonVariants } = await vite.ssrLoadModule("/components/ui/button.tsx");

function event(key) {
  return { key, defaultPrevented: false, stopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.stopped = true; },
  };
}
function text(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return node?.props ? text(node.props.children) : "";
}

test("Button is a non-submitting action unless submit is explicit", () => {
  assert.equal(Button({ children: "保存" }).props.type, "button");
  assert.equal(Button({ type: "submit", children: "保存" }).props.type, "submit");
  assert.equal(Button({ children: "保存" }).props["data-async"], undefined);
});

test("missing, empty and whitespace loading labels retain the visible content", () => {
  for (const loadingLabel of [undefined, "", "   "]) {
    const idle = Button({ loading: false, loadingLabel, children: "保存设置" });
    const busy = Button({ loading: true, loadingLabel, children: "保存设置" });
    assert.equal(idle.props["data-async"], true);
    assert.equal(busy.props["aria-busy"], true);
    const layers = busy.props.children.props.children;
    assert.equal(layers[0].props["aria-hidden"], true);
    assert.equal(layers[1].props["aria-hidden"], false);
    assert.equal(text(layers[1]), "保存设置");
    assert.equal(text(idle.props.children), text(busy.props.children));
  }
});

test("custom loading labels and icon labels preserve accessible names", () => {
  const button = Button({ loading: true, loadingLabel: " 分析中 ", variant: "ai-primary", children: "智能分析" });
  assert.equal(button.props["aria-label"], "分析中");
  assert.equal(button.props["data-variant"], "ai-primary");
  const icon = Button({ size: "icon", loading: true, "aria-label": "刷新", children: React.createElement("svg", { "aria-hidden": true }) });
  assert.equal(icon.props["aria-label"], "刷新");
  assert.equal(icon.props["data-size"], "icon");
});

test("loading keeps focusability but blocks click, Enter and Space", () => {
  let count = 0;
  const busy = Button({ loading: true, children: "保存", onClick: () => count++ });
  assert.equal(busy.props.disabled, false);
  assert.equal(busy.props["aria-disabled"], true);
  const click = event(); busy.props.onClick(click);
  assert.equal(click.defaultPrevented, true);
  for (const key of ["Enter", " "]) {
    const keyEvent = event(key); busy.props.onKeyDown(keyEvent);
    assert.equal(keyEvent.defaultPrevented, true);
  }
  const tab = event("Tab"); busy.props.onKeyDown(tab);
  assert.equal(tab.defaultPrevented, false);
  assert.equal(count, 0);
  Button({ loading: false, onClick: () => count++ }).props.onClick(event());
  assert.equal(count, 1);
});

test("disabled remains native and caller props/ref are preserved", () => {
  const ref = React.createRef();
  const button = Button({ disabled: true, id: "save", ref, "aria-describedby": "hint", children: "保存" });
  assert.equal(button.props.disabled, true);
  assert.equal(button.props.id, "save");
  assert.equal(button.props.ref, ref);
  assert.equal(button.props["aria-describedby"], "hint");
});

test("asChild retains link markup and child-first cancellation", () => {
  let parent = 0; let child = 0;
  const anchor = React.createElement("a", {
    href: "/components", onClick(e) { child++; e.preventDefault(); },
  }, "组件");
  const available = Button({ asChild: true, children: anchor, onClick: () => parent++ });
  available.props.onClick(event());
  assert.equal(child, 1); assert.equal(parent, 0);
  const html = renderToStaticMarkup(available);
  assert.match(html, /^<a /);
  assert.match(html, /href="\/components"/);
  assert.doesNotMatch(html, /<button/);
  const busy = Button({ asChild: true, loading: true, children: anchor, onClick: () => parent++ });
  const blocked = event(); busy.props.onClick(blocked);
  assert.equal(child, 1); assert.equal(parent, 0);
  assert.equal(blocked.defaultPrevented, true);
  const disabledChild = Button({ asChild: true, children: React.createElement("button", { disabled: true }, "关闭") });
  assert.equal(disabledChild.props.children.props.disabled, true);
  assert.equal(disabledChild.props["aria-disabled"], true);
});

test("all variants and existing size names are exported without preview classes", () => {
  for (const variant of ["default", "primary", "secondary", "outline", "ghost", "ai-soft", "ai-primary", "destructive", "link"]) {
    for (const size of ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"]) {
      const html = renderToStaticMarkup(React.createElement(Button, { variant, size }, "操作"));
      assert.match(html, /data-slot="button"/);
      assert.match(html, new RegExp(`data-variant="${variant}"`));
      assert.ok(buttonVariants({ variant, size }));
      assert.doesNotMatch(html, /prism-button--|CandidateButton/);
    }
  }
});

test("Button reduced motion and cleanup rules are present in the real sources", async () => {
  const css = await readFile(new URL("../components/ui/button.module.css", import.meta.url), "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation:\s*none/);
  assert.match(css, /transition-duration:\s*80ms/);
  const [layout, benchmark, docs] = await Promise.all([
    "../app/layout.tsx", "../app/benchmark/page.tsx", "../components/prism/component-doc.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.doesNotMatch(layout, /\/review\/button/);
  assert.doesNotMatch(benchmark + docs, /function PrismButton|prism-button--|loading-mark/);
  await assert.rejects(access(new URL("../app/review/button/page.tsx", import.meta.url)), { code: "ENOENT" });
  await assert.rejects(access(new URL("../app/review/button/review.module.css", import.meta.url)), { code: "ENOENT" });
});
