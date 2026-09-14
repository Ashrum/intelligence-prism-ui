import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom", cacheDir: "node_modules/.vite-test-button",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
const { Button, buttonVariants } = await vite.ssrLoadModule(
  "/components/ui/button.tsx",
);

after(async () => {
  await vite.close();
});

function markup(props, children) {
  return renderToStaticMarkup(React.createElement(Button, props, children));
}

function event(overrides = {}) {
  return {
    key: "Enter",
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    propagationStopped: false,
    stopPropagation() {
      this.propagationStopped = true;
    },
    ...overrides,
  };
}

test("exposes seven formal variants and preserves every existing size", () => {
  const variants = [
    "default",
    "secondary",
    "outline",
    "ghost",
    "ai-soft",
    "ai-primary",
    "destructive",
  ];
  for (const variant of variants) {
    const html = markup({ variant, type: "button" }, variant);
    assert.match(html, new RegExp(`data-variant="${variant}"`));
    assert.match(buttonVariants({ variant }), /ui-button/);
  }

  const sizes = [
    "default",
    "compact",
    "xs",
    "sm",
    "lg",
    "icon",
    "icon-xs",
    "icon-sm",
    "icon-lg",
  ];
  for (const size of sizes) {
    assert.match(markup({ size, type: "button" }, size), new RegExp(`data-size="${size}"`));
  }
  assert.match(buttonVariants({ size: "default" }), /ui-button--size-default/);
  assert.match(buttonVariants({ size: "compact" }), /ui-button--size-compact/);
  assert.match(buttonVariants({ variant: "link" }), /ui-button--link/);
});

test("preserves React children for omitted, empty, and blank loading labels", () => {
  const content = React.createElement(
    React.Fragment,
    null,
    React.createElement("svg", { "aria-hidden": "true", "data-test-icon": "true" }),
    React.createElement("strong", null, "提交证据"),
  );
  const cases = [
    { loading: true },
    { loading: true, loadingLabel: "" },
    { loading: true, loadingLabel: "   " },
  ];

  for (const props of cases) {
    const html = markup({ ...props, type: "button" }, content);
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /aria-disabled="true"/);
    assert.match(html, /data-slot="button-spinner"/);
    assert.match(html, /data-visible="true"/);
    assert.match(html, /data-test-icon="true"/);
    assert.equal((html.match(/<strong/g) ?? []).length, 1);
    assert.match(html, />提交证据<\/strong>/);
    assert.doesNotMatch(html, /\[object Object\]|undefined/);
  }
});

test("reserves only controlled async buttons and accepts ReactNode loading labels", () => {
  const ordinary = markup({ type: "button" }, "普通按钮");
  const controlled = markup({ type: "button", loading: false }, "受控异步");
  const valid = markup(
    { type: "button", loading: true, loadingLabel: React.createElement("em", null, "处理中") },
    React.createElement("strong", null, "开始处理"),
  );

  assert.doesNotMatch(ordinary, /button-spinner|button-loading/);
  assert.match(controlled, /ui-button__spinner--reserved/);
  assert.match(valid, /data-slot="button-loading"/);
  assert.match(valid, /<em>处理中<\/em>/);
  assert.equal((valid.match(/<strong/g) ?? []).length, 1);
  assert.doesNotMatch(valid, /\[object Object\]/);
});

test("blocks native activation while loading or disabled", () => {
  for (const props of [{ loading: true }, { disabled: true }]) {
    let calls = 0;
    const element = Button({ ...props, onClick: () => { calls += 1; } });
    const first = event();
    const second = event();
    element.props.onClick(first);
    element.props.onClick(second);
    assert.equal(calls, 0);
    assert.equal(first.defaultPrevented, true);
    assert.equal(first.propagationStopped, true);
  }

  let activeCalls = 0;
  const active = Button({ onClick: () => { activeCalls += 1; } });
  active.props.onClick(event());
  active.props.onClick(event());
  assert.equal(activeCalls, 2);
});

test("keeps asChild as one guarded link with child then Button events", () => {
  const order = [];
  const anchor = React.createElement(
    "a",
    { href: "#target", onClick: () => order.push("child") },
    "查看规范",
  );
  const html = markup(
    { asChild: true, variant: "link", onClick: () => order.push("button") },
    anchor,
  );
  assert.equal((html.match(/<a\b/g) ?? []).length, 1);
  assert.equal((html.match(/<button\b/g) ?? []).length, 0);
  assert.match(html, /href="#target"/);
  assert.match(html, /data-slot="button"/);

  const active = Button({
    asChild: true,
    children: anchor,
    onClick: () => order.push("button"),
  });
  active.props.children.props.child.props.onClick(event());
  assert.deepEqual(order, ["child", "button"]);

  for (const props of [{ loading: true }, { disabled: true }]) {
    let childCalls = 0;
    let buttonCalls = 0;
    const blocked = Button({
      ...props,
      asChild: true,
      children: React.createElement("a", { href: "#blocked", onClick: () => { childCalls += 1; } }, "阻止导航"),
      onClick: () => { buttonCalls += 1; },
    });
    const click = event();
    blocked.props.children.props.child.props.onClick(click);
    assert.equal(childCalls, 0);
    assert.equal(buttonCalls, 0);
    assert.equal(click.defaultPrevented, true);
  }
});

test("preserves native submit, true disabled, and icon naming", () => {
  assert.match(markup({ type: "submit" }, "提交"), /type="submit"/);
  assert.match(markup({ disabled: true }, "禁用"), / disabled=""/);
  const icon = markup(
    { type: "button", size: "icon", "aria-label": "刷新教育证据" },
    React.createElement("svg", { "aria-hidden": "true" }),
  );
  assert.match(icon, /aria-label="刷新教育证据"/);
  assert.match(icon, /data-size="icon"/);
});

test("removes the temporary review implementation and page-level Button copies", async () => {
  await assert.rejects(access(path.join(root, "app/(legacy)/review/button/page.tsx")));
  await assert.rejects(access(path.join(root, "app/(legacy)/review/button/review.module.css")));

  const [layout, docs, benchmark, css] = await Promise.all([
    readFile(path.join(root, "app/(legacy)/layout.tsx"), "utf8"),
    readFile(path.join(root, "components/prism/component-doc.tsx"), "utf8"),
    readFile(path.join(root, "app/(legacy)/benchmark/page.tsx"), "utf8"),
    readFile(path.join(root, "app/globals.css"), "utf8"),
  ]);
  assert.doesNotMatch(layout, /review\/button|设计评审/);
  assert.doesNotMatch(docs, /function PrismButton|prism-button--|loading-mark/);
  assert.doesNotMatch(benchmark, /function PrismButton|prism-button--|loading-mark/);
  assert.doesNotMatch(css, /\.prism-button(?:--|\s|\{|:|\[)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.ui-button__spinner\s*\{[^}]*animation:/s);
});
