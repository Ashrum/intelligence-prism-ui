import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LayoutFocus, LayoutForm, LayoutList, LayoutSplit, LeaveConfirmDialog, LeaveGuardProvider, PageHeader,
  PageStatePanel, ProcessHost, WorkbenchDialog, computeDialogWidth, computeFormLayout,
  computeListShouldCollapse, computeSplitCanSideBySide, dialogWidths, useLeaveGuard, useProcessHost,
  type LeaveGuardHost, type PageStatePanelProps,
} from "@ole/ui";

test("LayoutForm caps registered form width and subtracts a 180px anchor and its registered gap", () => {
  assert.deepEqual(computeFormLayout(1500, { columns: 2, anchor: true, anchorGap: 32 }), {
    columns: 2, formWidth: 960, anchorWidth: 180, anchorGap: 32,
  });
  assert.deepEqual(computeFormLayout(950, { columns: 2, anchor: true }), {
    columns: 2, formWidth: 746, anchorWidth: 180, anchorGap: 24,
  });
  assert.equal(computeFormLayout(1500, { maxWidth: 700 }).formWidth, 700);
  assert.equal(computeFormLayout(1500).formWidth, 760);
  assert.equal(computeFormLayout(20).formWidth, 20);
});

test("LayoutForm collapses the anchor before changing column count", () => {
  const options = { columns: 2, anchor: true } as const;
  assert.deepEqual(computeFormLayout(844, options), { columns: 2, formWidth: 640, anchorWidth: 180, anchorGap: 24 });
  assert.deepEqual(computeFormLayout(843, options), { columns: 2, formWidth: 843, anchorWidth: 0, anchorGap: 0 });
  assert.equal(computeFormLayout(640, options).columns, 2);
  assert.deepEqual(computeFormLayout(639, options), { columns: 1, formWidth: 639, anchorWidth: 0, anchorGap: 0 });
  assert.equal(computeFormLayout(1000, { ...options, maxWidth: 600 }).columns, 1);
});

test("LayoutList collapses only above 320px of fixed chrome or below 360px of visible body", () => {
  assert.equal(computeListShouldCollapse({ fixedChromeHeight: 320, visibleBodyHeight: 360 }), false);
  assert.equal(computeListShouldCollapse({ fixedChromeHeight: 321, visibleBodyHeight: 1000 }), true);
  assert.equal(computeListShouldCollapse({ fixedChromeHeight: 200, visibleBodyHeight: 359 }), true);
  assert.equal(computeListShouldCollapse({ fixedChromeHeight: 321, visibleBodyHeight: 359 }), true);
});

test("LayoutSplit switches at the exact sum of list, divider and detail widths", () => {
  assert.deepEqual([760, 761, 762].map((width) => computeSplitCanSideBySide(width)), [false, true, true]);
  assert.equal(computeSplitCanSideBySide(741, { listWidth: 260 }), true);
  assert.equal(computeSplitCanSideBySide(820, { listWidth: 340 }), false);
});

test("ProcessHost title ownership omits PageHeader in all templates", () => {
  const header = { title: "Template heading" };
  const templates = [
    createElement(LayoutList, { header, children: "Results" }),
    createElement(LayoutSplit, { header, list: "Objects", children: "Detail" }),
    createElement(LayoutFocus, { header, children: "Stage" }),
    createElement(LayoutForm, { header, children: "Fields" }),
  ];
  for (const template of templates) {
    assert.match(renderToStaticMarkup(template), /data-slot="workbench-page-header"/);
    const html = renderToStaticMarkup(createElement(ProcessHost, {
      ownsHeader: true, title: "Process heading", steps: "Current step", actions: {}, onAction() {}, children: template,
    }));
    assert.match(html, /Process heading/);
    assert.match(html, /Current step/);
    assert.doesNotMatch(html, /Template heading|data-slot="workbench-page-header"/);
  }
});

test("ProcessHost shares pending state with both slots and descendant actions", () => {
  function Descendant() {
    const process = useProcessHost();
    return createElement("button", { disabled: process?.actions.next?.disabled }, "Duplicate next");
  }
  const html = renderToStaticMarkup(createElement(ProcessHost, {
    actions: { save: { pending: true }, next: {} }, onAction() {},
    next: (state) => createElement("button", { disabled: state.disabled }, "Next slot"),
    children: createElement(Descendant),
  }));
  assert.match(html, /<button disabled="">Next slot/);
  assert.match(html, /<button disabled="">Duplicate next/);
});

test("PageHeader caps secondary actions and retains the primary action and back entry when compact", () => {
  const header = {
    title: "Page", back: createElement("button", {}, "Back"),
    primaryAction: { id: "primary", label: "Create", onSelect() {} },
    secondaryActions: ["Visible 1", "Visible 2", "Overflow"].map((label) => ({ id: label, label, onSelect() {} })),
    tabs: "Tabs", compactTabs: "Tabs chooser",
  };
  const wide = renderToStaticMarkup(createElement(PageHeader, header));
  assert.match(wide, /Visible 1/);
  assert.match(wide, /Visible 2/);
  assert.doesNotMatch(wide, /Overflow|Tabs chooser/);
  const compact = renderToStaticMarkup(createElement(PageHeader, { ...header, compact: true }));
  assert.match(compact, /Back/);
  assert.match(compact, /Create/);
  assert.match(compact, /Tabs chooser/);
  assert.doesNotMatch(compact, /Visible [12]/);
});

test("WorkbenchDialog uses the three DialogSize widths, desktop height cap, and mobile viewport selector", () => {
  assert.deepEqual(Object.values(dialogWidths), [400, 560, 720]);
  assert.equal(computeDialogWidth(767, "lg"), 767);
  assert.equal(computeDialogWidth(768, "lg", { start: 30, end: 28 }), 710);
  for (const size of ["sm", "md", "lg"] as const) {
    assert.equal(computeDialogWidth(1280, size), dialogWidths[size]);
    assert.equal(renderToStaticMarkup(createElement(WorkbenchDialog, {
      open: false, onOpenChange() {}, size, title: "Dialog", children: "Content",
    })), "");
  }
  const css = readFileSync(new URL(import.meta.resolve("@ole/ui/styles/theme-workbench.css")), "utf8");
  assert.match(css, /max-block-size: min\(85dvh, 720px, 100%\)/);
  assert.match(css, /\[data-slot="workbench-dialog"\]\[data-viewport="mobile"\]/);
});

test("LeaveConfirmDialog lists each blocked editor and omits any bulk discard action", () => {
  const hosts: LeaveGuardHost[] = ["评分", "批注"].map((id) => ({
    id, objectId: "exam-01", dirty: true, discard() {}, returnToEdit() {},
  }));
  function BlockedNavigation() {
    const guard = useLeaveGuard();
    guard.request({
      id: "leave", target: "list", navigate() {},
      read: () => ({ intentId: "leave", target: "list", valid: true, hosts }),
    });
    return createElement(LeaveConfirmDialog, { presentation: "inline" });
  }
  const html = renderToStaticMarkup(createElement(LeaveGuardProvider, { children: createElement(BlockedNavigation) }));
  assert.match(html, /有多处未保存修改/);
  assert.match(html, /评分/);
  assert.match(html, /批注/);
  assert.equal([...html.matchAll(/返回编辑/g)].length, 2);
  assert.doesNotMatch(html, /全部放弃|放弃修改/);
});

test("PageStatePanel preserves the distinction and recovery actions for all six page states", () => {
  const samples: [PageStatePanelProps, string, string?][] = [
    [{ state: "loading" }, "正在加载"],
    [{ state: "error", onRetry() {} }, "加载失败", "重试"],
    [{ state: "forbidden" }, "无权限"],
    [{ state: "empty" }, "无数据"],
    [{ state: "no-results", onReset() {} }, "筛选无结果", "重置筛选"],
    [{ state: "partial-success", onRetryFailed() {} }, "部分成功", "重试失败项"],
  ];
  for (const [props, title, recovery] of samples) {
    const html = renderToStaticMarkup(createElement(PageStatePanel, props));
    assert.match(html, new RegExp(`data-state="${props.state}"`));
    assert.match(html, new RegExp(title));
    if (recovery) assert.match(html, new RegExp(`${recovery}</button>`));
    else assert.doesNotMatch(html, /<button/);
  }
});
