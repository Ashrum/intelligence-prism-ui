import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AppShell, DrawerChannelHost, DrawerChannelProvider, LeaveGuardProvider, PortalScope,
  auxiliaryPaneWidths, computeContentNetWidth, computeDialogWidth, computeDrawerWidth,
  computeSplitCanSideBySide, createLeaveGuardController, degradeLayout, dialogWidths,
  drawerChannelReducer, drawerWidths, getDrawerExitPolicy, getDrawerExitRequest,
  initialDrawerChannelState, initialLeaveGuardState, transitionLeaveGuard,
  useDrawerChannel, useLeaveGuard, useLeaveGuardState, useOlePortalAttributes, usePortalProps,
  type DrawerChannelState, type DrawerChannelView, type DrawerExitReason,
  type LeaveGuardController, type LeaveGuardHost, type LeaveIntent, type LeaveValidation,
} from "@ole/ui";

test("P1 styles resolve from the package and supply all semantic layers without legacy root ownership", () => {
  const tokens = readFileSync(new URL(import.meta.resolve("@ole/ui/styles/tokens.css")), "utf8");
  const workbenchTheme = readFileSync(new URL(import.meta.resolve("@ole/ui/styles/theme-workbench.css")), "utf8");
  const standaloneTheme = readFileSync(new URL(import.meta.resolve("@ole/ui/styles/theme.css")), "utf8");
  for (const [tokenName, value] of Object.entries({
    "--ole-z-index-content": 0,
    "--ole-z-index-sticky": 10,
    "--ole-z-index-shell": 20,
    "--ole-z-index-auxiliary": 25,
    "--ole-z-index-scrim": 40,
    "--ole-z-index-modal": 50,
    "--ole-z-index-popover": 60,
    "--ole-z-index-toast": 70,
  })) {
    assert.match(tokens, new RegExp(`${tokenName}: ${value};`));
  }
  assert.match(workbenchTheme, /@import "\.\/tokens\.css"/);
  assert.match(workbenchTheme, /@source[^;]+dist\/layout/);
  assert.match(workbenchTheme, /@custom-variant dark/);
  assert.doesNotMatch(workbenchTheme, /@container\s+style\(/);
  assert.doesNotMatch(workbenchTheme, /@media[^{}]*\bwidth\b/);
  assert.match(workbenchTheme, /\[data-slot="workbench-drawer"\]\[data-viewport="compact"\]/);
  assert.match(workbenchTheme, /\[data-slot="workbench-drawer"\]\[data-viewport="desktop"\]/);
  assert.doesNotMatch(workbenchTheme, /--(?:background|foreground|popover|border)\s*:/);
  assert.match(standaloneTheme, /@import "\.\/theme-workbench\.css"/);
});

test("PortalScope copies effective context and density onto per-portal wrappers", () => {
  function PortalProbe({ explicit }: { explicit?: null }) {
    const props = usePortalProps({ container: explicit, "data-probe": "kept" });
    const { container, ...attributes } = props ?? {};
    return createElement("div", { ...attributes, "data-explicit": container === null });
  }
  function HostProbe() {
    return createElement("div", { ...useOlePortalAttributes(), "data-host": "" });
  }

  const render = (oleContext: "dark" | "light", oleDensity: "compact" | "default") =>
    renderToStaticMarkup(createElement(PortalScope, {
      oleContext, oleDensity,
      children: [
        createElement(HostProbe, { key: "host" }),
        createElement(PortalProbe, { key: "portal", explicit: null }),
        createElement(PortalScope, {
          key: "paper", oleContext: "paperForcedLight", children: createElement(PortalProbe),
        }),
      ],
    }));
  const dark = render("dark", "compact");
  assert.match(dark, /data-ole-context="dark" data-ole-density="compact" data-host=""/);
  assert.match(dark, /data-probe="kept" data-ole-context="dark" data-ole-density="compact" data-explicit="true"/);
  assert.match(dark, /data-ole-context="paperForcedLight" data-ole-density="compact"/);
  const light = render("light", "default");
  assert.match(light, /data-ole-context="light" data-ole-density="default"/);
  assert.match(light, /data-ole-context="paperForcedLight" data-ole-density="default"/);
  assert.doesNotMatch(renderToStaticMarkup(createElement(PortalProbe)), /data-ole-/);

  const nested = renderToStaticMarkup(createElement(PortalScope, {
    container: null,
    children: createElement(PortalScope, { oleContext: "dark", children: createElement(PortalProbe) }),
  }));
  assert.match(nested, /data-ole-context="dark" data-explicit="true"/);
});

test("Dialog, Drawer and AuxiliaryPane use their own registered sizes", () => {
  assert.deepEqual(auxiliaryPaneWidths, { sm: 360, md: 400, lg: 440 });
  assert.deepEqual(dialogWidths, { sm: 400, md: 560, lg: 720 });
  assert.deepEqual(drawerWidths, { sm: 400, md: 560, lg: 760, xl: 840 });
  assert.equal(computeDialogWidth(1920, "sm"), 400);
  assert.equal(computeDialogWidth(1920, "md"), 560);
  assert.equal(computeDialogWidth(1920, "lg"), 720);
  assert.equal(computeDrawerWidth(1920, "lg"), 760);
  assert.equal(computeDrawerWidth(1920, "xl"), 840);
});

test("Dialog is full-screen below 768px and budgets both safe margins from 768px", () => {
  assert.equal(computeDialogWidth(320, "sm"), 320);
  assert.equal(computeDialogWidth(767, "sm"), 767);
  assert.equal(computeDialogWidth(768, "sm"), 400);
  assert.equal(computeDialogWidth(768, "lg", 32), 704);
  assert.equal(computeDialogWidth(768, "lg", { start: 40, end: 20 }), 708);
  assert.equal(computeDialogWidth(768, "sm", 500), 0);
});

test("Drawer applies the 768px and 1280px breakpoints without rounding the desktop cap", () => {
  assert.equal(computeDrawerWidth(320, "xl"), 320);
  assert.equal(computeDrawerWidth(767, "md", 24), 767);
  assert.equal(computeDrawerWidth(768, "sm"), 752);
  assert.equal(computeDrawerWidth(1279, "md", 24), 1255);
  assert.equal(computeDrawerWidth(1280, "md", 24), 560);
  assert.equal(computeDrawerWidth(1280, "xl", 24), 832);
  assert.equal(computeDrawerWidth(1281, "xl"), 1281 * 0.65);
  assert.equal(computeDrawerWidth(1440, "xl"), 840);
});

test("Content width preserves the 1280px Focus and Split pilot calculations", () => {
  assert.equal(computeContentNetWidth({
    width: 1280, l1Width: 56, auxiliaryWidth: 400, paddingStart: 16, paddingEnd: 16,
  }), 792);
  const splitWidth = computeContentNetWidth({
    width: 1280, l1Width: 56, auxiliaryWidth: 440, paddingStart: 24, paddingEnd: 24,
  });
  assert.equal(splitWidth, 736);
  assert.equal(computeSplitCanSideBySide(splitWidth), false);
  assert.equal(computeContentNetWidth({
    width: 1440, l1Width: 56, l2Width: 208, auxiliaryWidth: 360,
    paddingStart: 17, paddingEnd: 23, rulerWidth: 28, outsideGap: 12,
  }), 736);
  assert.equal(computeContentNetWidth({ width: 1920, maxContentWidth: 960 }), 960);
  assert.equal(computeContentNetWidth({ width: 340, auxiliaryWidth: 360 }), 0);
});

test("Split uses the inclusive 761px threshold and respects registered widths and content floor", () => {
  assert.deepEqual([760, 761, 762].map((width) => computeSplitCanSideBySide(width)), [false, true, true]);
  assert.equal(computeSplitCanSideBySide(740, { listWidth: 260 }), false);
  assert.equal(computeSplitCanSideBySide(741, { listWidth: 260 }), true);
  assert.equal(computeSplitCanSideBySide(820, { listWidth: 340 }), false);
  assert.equal(computeSplitCanSideBySide(821, { listWidth: 340 }), true);
  assert.equal(computeSplitCanSideBySide(800, { dividerWidth: 0, detailMinWidth: 500, contentMinWidth: 820 }), false);
  assert.equal(computeSplitCanSideBySide(820, { dividerWidth: 0, detailMinWidth: 500, contentMinWidth: 820 }), true);
});

const auxiliaryEntry = { kind: "drawer", size: "md" } as const;

test("Degradation applies all five steps and restores the manual L2 preference on wider budgets", () => {
  const input = {
    width: 1060, paddingStart: 24, paddingEnd: 24, rulerWidth: 40, optionalRuler: true, split: {},
    auxiliaryPane: { size: "lg", entry: auxiliaryEntry },
  } as const;
  assert.deepEqual(degradeLayout(input), {
    l1Width: 56, l2Width: 0, l2PreferredExpanded: true, rulerWidth: 0,
    auxiliaryPane: auxiliaryEntry, split: "single-view", contentNetWidth: 956, fits: true,
    appliedSteps: [1, 2, 3, 4, 5],
  });
  const wide = degradeLayout({ ...input, width: 1600 });
  assert.equal(wide.l2Width, 208);
  assert.deepEqual(wide.auxiliaryPane, { kind: "inline", size: "lg" });
  assert.deepEqual(wide.appliedSteps, []);
  assert.equal(degradeLayout({ ...input, width: 1600, l2PreferredExpanded: false }).l2Width, 0);

  const stageOne = degradeLayout({ width: 1280, auxiliaryPane: { entry: auxiliaryEntry } });
  assert.deepEqual(stageOne.appliedSteps, [1]);
  assert.deepEqual(stageOne.auxiliaryPane, { kind: "inline", size: "md" });
});

test("A registered reorder can keep Split side by side by narrowing AuxiliaryPane first", () => {
  const input = {
    width: 1280, l2PreferredExpanded: false, paddingStart: 24, paddingEnd: 24, split: {},
    auxiliaryPane: { size: "lg", entry: auxiliaryEntry },
  } as const;
  const baseline = degradeLayout(input);
  assert.deepEqual(baseline.appliedSteps, [2]);
  assert.equal(baseline.contentNetWidth, 736);
  assert.equal(baseline.split, "single-view");

  const reordered = degradeLayout({ ...input, order: [3, 2, 4] });
  assert.deepEqual(reordered.appliedSteps, [3]);
  assert.equal(reordered.contentNetWidth, 776);
  assert.equal(reordered.split, "side-by-side");
  assert.deepEqual(reordered.auxiliaryPane, { kind: "inline", size: "md" });
});

test("Degradation checks each auxiliary size and preserves the reachable entry when the floor cannot fit", () => {
  const checked: string[] = [];
  const result = degradeLayout({
    width: 1156, l2Width: 0, rulerWidth: 48, optionalRuler: true,
    auxiliaryPane: {
      size: "lg", entry: auxiliaryEntry, canUseSize: (size) => { checked.push(size); return size !== "md"; },
    },
  });
  assert.ok(checked.includes("md"));
  assert.ok(!checked.includes("sm"));
  assert.deepEqual(result.appliedSteps, [4, 5]);
  assert.deepEqual(result.auxiliaryPane, auxiliaryEntry);
  const minSize = degradeLayout({
    width: 1120, l2Width: 0, auxiliaryPane: { size: "md", minSize: "md", entry: auxiliaryEntry },
  });
  assert.deepEqual(minSize.appliedSteps, [5]);

  const unavailable = degradeLayout({
    width: 390, l1Width: 0, l2Width: 0, auxiliaryPane: { entry: { kind: "single-view" } },
  });
  assert.equal(unavailable.fits, false);
  assert.deepEqual(unavailable.auxiliaryPane, { kind: "single-view" });
  assert.equal(unavailable.appliedSteps.at(-1), 5);
});

test("An immersive shell can drop decorative tracks and optionally L1 on step four", () => {
  const input = { mode: "immersive", width: 1160, rulerWidth: 32, auxiliaryPane: { entry: auxiliaryEntry } } as const;
  const preserved = degradeLayout(input);
  assert.equal(preserved.rulerWidth, 32);
  assert.equal(preserved.l1Width, 56);
  assert.equal(preserved.l2PreferredExpanded, false);
  const collapsed = degradeLayout({ ...input, order: [4, 3, 2], optionalRuler: true, allowImmersiveL1Collapse: true });
  assert.deepEqual(collapsed.appliedSteps, [4]);
  assert.equal(collapsed.rulerWidth, 0);
  assert.equal(collapsed.l1Width, 0);
  assert.deepEqual(collapsed.auxiliaryPane, { kind: "inline", size: "md" });
});

const root: DrawerChannelView = {
  id: "auxiliary", host: "inspector", kind: "auxiliary", title: "Inspector", mode: "editing", size: "md",
  taskRef: "task-5", objectId: "paper-3", step: "grade", draft: { score: 8 },
};
const child: DrawerChannelView = {
  id: "paper", host: "preview", kind: "business", title: "Paper", mode: "readonly", size: "xl",
};

function openDrawer(view = root) {
  return drawerChannelReducer(initialDrawerChannelState, { type: "openRoot", view });
}

function exitDrawer(state: DrawerChannelState, reason: DrawerExitReason = "topbar") {
  const request = getDrawerExitRequest(state, reason);
  assert.ok(request);
  return drawerChannelReducer(state, { type: "applyExit", request });
}

test("Drawer keeps one root and one explicit-size child, suspending and restoring the source snapshot", () => {
  const opened = openDrawer();
  const focusTarget = () => null;
  assert.equal(drawerChannelReducer(opened, { type: "openRoot", view: child }), opened);
  assert.equal(drawerChannelReducer(opened, { type: "pushChild", fromViewId: "stale", view: child }), opened);
  const nested = drawerChannelReducer(opened, {
    type: "pushChild", fromViewId: root.id, view: child, snapshot: { focusTarget, scrollTop: 300 },
  });
  assert.deepEqual(nested.views, [{ ...root, focusTarget, scrollTop: 300 }, child]);
  assert.equal(nested.views[1]?.size, "xl");
  assert.equal(drawerChannelReducer(nested, { type: "pushChild", fromViewId: child.id, view: root }), nested);
  assert.equal(drawerChannelReducer(nested, { type: "updateActive", viewId: root.id, snapshot: { draft: null } }), nested);
  const restored = exitDrawer(nested, "escape");
  assert.deepEqual(restored.views, [{ ...root, focusTarget, scrollTop: 300 }]);
  assert.deepEqual(exitDrawer(restored).views, []);
});

test("Any business view yields the slot, including a suspended business root", () => {
  const opened = openDrawer();
  assert.equal(opened.auxiliaryPaneYielded, false);
  const nested = drawerChannelReducer(opened, { type: "pushChild", fromViewId: root.id, view: child });
  assert.equal(nested.auxiliaryPaneYielded, true);
  assert.equal(exitDrawer(nested).auxiliaryPaneYielded, false);
  const businessRoot = openDrawer(child);
  const navigation = { ...root, kind: "navigation" } as const;
  const nestedNavigation = drawerChannelReducer(businessRoot, {
    type: "pushChild", fromViewId: child.id, view: navigation,
  });
  assert.equal(nestedNavigation.auxiliaryPaneYielded, true);
  assert.equal(exitDrawer(nestedNavigation).auxiliaryPaneYielded, true);
  assert.equal(drawerChannelReducer(nestedNavigation, { type: "invalidateView", viewId: child.id }).auxiliaryPaneYielded, false);
});

test("Drawer routes all available exits to close or back and blocks repeated Escape", () => {
  const editing = openDrawer();
  assert.deepEqual(getDrawerExitPolicy(editing), { action: "close", topBar: true, escape: true, backdrop: false });
  assert.equal(getDrawerExitRequest(editing, "backdrop"), undefined);
  assert.equal(getDrawerExitPolicy(openDrawer({ ...root, allowBackdropExit: true })).backdrop, true);
  assert.equal(getDrawerExitPolicy(openDrawer({ ...child, allowBackdropExit: false })).backdrop, false);
  const readonly = drawerChannelReducer(editing, { type: "pushChild", fromViewId: root.id, view: child });
  for (const reason of ["escape", "backdrop", "topbar"] as const) {
    assert.equal(getDrawerExitRequest(readonly, reason)?.action, "back");
    for (const phase of ["confirming", "saving", "blocked"] as const) {
      assert.equal(getDrawerExitRequest(readonly, reason, phase), undefined);
    }
  }
  assert.equal(getDrawerExitRequest(readonly, "escape", "idle", true), undefined);
});

test("Drawer rejects a stale exit even when the view ID is reused", () => {
  const first = openDrawer();
  const request = getDrawerExitRequest(first, "topbar");
  assert.ok(request);
  const reopened = drawerChannelReducer(exitDrawer(first), { type: "openRoot", view: root });
  assert.equal(drawerChannelReducer(reopened, { type: "applyExit", request }), reopened);
});

function editHost(overrides: Partial<LeaveGuardHost> = {}): LeaveGuardHost {
  return { id: "editor", objectId: "paper", dirty: true, discard() {}, returnToEdit() {}, ...overrides };
}

function intent(
  id: string, getHosts: () => readonly LeaveGuardHost[], navigate: () => void,
  overrides?: () => Partial<LeaveValidation>,
): LeaveIntent {
  const target = `/workbench/${id}`;
  return { id, target, navigate, read: () => ({ valid: true, intentId: id, target, hosts: getHosts(), ...overrides?.() }) };
}

function pendingToken(controller: LeaveGuardController): number {
  const state = controller.getState();
  assert.ok("pending" in state);
  return state.pending.token;
}

function deferredSave() {
  return Promise.withResolvers<void>();
}

test("The leave reducer is pure, including when it emits a navigation command", () => {
  let navigated = 0;
  const item = intent("A", () => [], () => { navigated++; });
  const result = transitionLeaveGuard(Object.freeze(initialLeaveGuardState), {
    type: "request", intent: item, live: item.read(),
  });
  assert.equal(result.state.status, "idle");
  assert.equal(result.command?.type, "navigate");
  assert.equal(navigated, 0);
});

test("An invalid request leaves the guard ready for the first valid intent and clean exits navigate immediately", () => {
  const controller = createLeaveGuardController();
  const destinations: string[] = [];
  controller.request(intent("invalid", () => [], () => destinations.push("invalid"), () => ({ valid: false })));
  assert.deepEqual(controller.getState(), initialLeaveGuardState);
  controller.request(intent("clean", () => [editHost({ dirty: false })], () => destinations.push("clean")));
  assert.deepEqual(destinations, ["clean"]);
  assert.equal(controller.getState().status, "idle");
});

test("Only the first valid intent is read or executed while confirming", () => {
  const calls: string[] = [];
  const controller = createLeaveGuardController();
  const host = editHost({ discard: () => calls.push("discard A") });
  controller.request(intent("A", () => [host], () => calls.push("A")));
  const token = pendingToken(controller);
  controller.request(intent("B", () => { calls.push("read B"); return []; }, () => calls.push("B")));
  controller.dismiss("backdrop");
  assert.equal(controller.getState().status, "confirming");
  controller.discard(token);
  controller.discard(token);
  assert.deepEqual(calls, ["discard A", "A"]);
  assert.equal(controller.getState().status, "idle");
});

test("Continue and Escape cancel confirmation and forbid stale discard actions", () => {
  const controller = createLeaveGuardController();
  let originalDraft = "grading notes";
  const host = editHost({ discard: () => { originalDraft = ""; } });
  const request = intent("A", () => [host], () => assert.fail("cancelled intent navigated"));
  controller.request(request);
  const previousToken = pendingToken(controller);
  controller.dismiss("continue");
  controller.request(request);
  const newToken = pendingToken(controller);
  assert.notEqual(previousToken, newToken);
  controller.discard(previousToken);
  assert.equal(pendingToken(controller), newToken);
  controller.dismiss("escape");
  assert.equal(controller.getState().status, "idle");
  assert.equal(originalDraft, "grading notes");
});

test("An intent invalidated during discard cannot execute its navigation", () => {
  const controller = createLeaveGuardController();
  let token = 0;
  const host = editHost({ discard: () => controller.invalidate(token) });
  controller.request(intent("A", () => [host], () => assert.fail("invalidated discard navigated")));
  token = pendingToken(controller);
  controller.discard(token);
  assert.equal(controller.getState().status, "idle");
});

test("Save and leave is optional and respects a disappearing save capability", () => {
  const controller = createLeaveGuardController();
  let host = editHost();
  const request = intent("A", () => [host], () => assert.fail("unsaved change navigated"));
  controller.request(request);
  const state = controller.getState();
  assert.equal(state.status, "confirming");
  assert.equal(state.canSaveAndLeave, false);
  controller.saveAndLeave(pendingToken(controller));
  assert.equal(controller.getState(), state);
  controller.dismiss("continue");
  host = editHost({ save() {} });
  controller.request(request);
  host = editHost();
  controller.saveAndLeave(pendingToken(controller));
  assert.equal(controller.getState().status, "confirming");
});

test("An in-flight save ignores a second intent, repeat save, discard, Escape and backdrop", async () => {
  const controller = createLeaveGuardController();
  const save = deferredSave();
  const calls: string[] = [];
  const host = editHost({ save: () => { calls.push("save"); return save.promise; }, discard: () => calls.push("discard") });
  controller.request(intent("A", () => [host], () => calls.push("A")));
  const token = pendingToken(controller);
  controller.saveAndLeave(token);
  controller.saveAndLeave(token);
  controller.discard(token);
  controller.dismiss("escape");
  controller.dismiss("backdrop");
  controller.dismiss("continue");
  controller.request(intent("B", () => { calls.push("read B"); return []; }, () => calls.push("B")));
  assert.equal(controller.getState().status, "saving");
  await setImmediate();
  assert.deepEqual(calls, ["save"]);
  host.dirty = false;
  save.resolve();
  await setImmediate();
  assert.deepEqual(calls, ["save", "A"]);
  assert.equal(controller.getState().status, "idle");
});

test("Save failure clears the intent and offers a per-host return to the intact draft", async () => {
  const controller = createLeaveGuardController();
  const save = deferredSave();
  const calls: string[] = [];
  const host = editHost({
    save: () => save.promise, discard: () => calls.push("discard"), returnToEdit: () => calls.push("return"),
  });
  controller.request(intent("A", () => [host], () => calls.push("A")));
  controller.saveAndLeave(pendingToken(controller));
  await setImmediate();
  const error = new Error("save rejected");
  save.reject(error);
  await setImmediate();
  const failed = controller.getState();
  assert.equal(failed.status, "failed");
  assert.equal(failed.error, error);
  assert.equal(failed.host.id, "editor");
  assert.equal("pending" in failed, false);
  assert.equal(host.dirty, true);
  controller.returnToEdit("editor");
  assert.deepEqual(calls, ["return"]);
  assert.equal(controller.getState().status, "idle");
});

test("Discard and save completion each revalidate the host, object, revision, target and original intent", async () => {
  const staleCases: readonly (() => Partial<LeaveValidation>)[] = [
    () => ({ hosts: [] }),
    () => ({ hosts: [editHost({ id: "other-editor" })] }),
    () => ({ hosts: [editHost({ objectId: "other-paper" })] }),
    () => ({ hosts: [editHost({ revision: 2 })] }),
    () => ({ hosts: [editHost({ revision: 1 }), editHost({ id: "second-editor" })] }),
    () => ({ target: "/removed" }),
    () => ({ intentId: "another-intent" }),
    () => ({ valid: false }),
    () => { throw new Error("unreadable target"); },
  ];
  for (const invalidate of staleCases) {
    for (const action of ["discard", "save"] as const) {
      const controller = createLeaveGuardController();
      const save = deferredSave();
      const host = editHost({
        revision: 1,
        save: () => save.promise, discard: () => assert.fail("discard after staleness"),
      });
      let stale = false;
      controller.request(intent(
        "A", () => [host], () => assert.fail("navigated after staleness"), () => stale ? invalidate() : {},
      ));
      const token = pendingToken(controller);
      if (action === "save") {
        controller.saveAndLeave(token);
        await setImmediate();
        stale = true;
        save.resolve();
        await setImmediate();
      } else {
        stale = true;
        controller.discard(token);
      }
      assert.equal(controller.getState().status, "idle");
      assert.equal(host.dirty, true);
    }
  }
});

test("An invalidated save cannot navigate or change a newer save even when intent and host IDs are reused", async () => {
  const controller = createLeaveGuardController();
  const first = deferredSave();
  const second = deferredSave();
  const calls: string[] = [];
  let host = editHost({ save: () => first.promise });
  controller.request(intent("A", () => [host], () => calls.push("old")));
  const token = pendingToken(controller);
  controller.saveAndLeave(token);
  await setImmediate();
  controller.invalidate(token);
  host = editHost({ save: () => second.promise });
  controller.request(intent("A", () => [host], () => calls.push("new")));
  const nextToken = pendingToken(controller);
  controller.saveAndLeave(nextToken);
  controller.invalidate(token);
  first.resolve();
  await setImmediate();
  assert.equal(pendingToken(controller), nextToken);
  assert.deepEqual(calls, []);
  second.resolve();
  await setImmediate();
  assert.deepEqual(calls, ["new"]);
});

test("A late save rejection cannot clear a newer confirmation or surface an obsolete error", async () => {
  const controller = createLeaveGuardController();
  const save = deferredSave();
  const host = editHost({ save: () => save.promise });
  controller.request(intent("A", () => [host], () => assert.fail("invalidated save navigated")));
  controller.saveAndLeave(pendingToken(controller));
  await setImmediate();
  controller.invalidate();
  controller.request(intent("B", () => [host], () => assert.fail("new intent navigated")));
  const confirming = controller.getState();
  save.reject(new Error("late failure"));
  await setImmediate();
  assert.equal(controller.getState(), confirming);
  assert.equal(confirming.status, "confirming");
});

test("Multiple independent dirty hosts clear the intent and expose only per-host editing returns", () => {
  const controller = createLeaveGuardController();
  const calls: string[] = [];
  const first = editHost({ returnToEdit: () => calls.push("first") });
  const second = editHost({ id: "agent", returnToEdit: () => calls.push("second") });
  const request = intent("A", () => [first, first, second], () => calls.push("A"));
  controller.request(request);
  const blocked = controller.getState();
  assert.equal(blocked.status, "blocked");
  assert.deepEqual(blocked.hosts.map(({ id }) => id), ["editor", "agent"]);
  assert.ok(blocked.hosts.every((host) => !("discard" in host) && !("save" in host)));
  assert.equal("pending" in blocked, false);
  controller.request(intent("B", () => [], () => calls.push("B")));
  controller.returnToEdit("agent");
  assert.deepEqual(calls, ["second"]);
  assert.equal(controller.getState().status, "idle");
  assert.equal(first.dirty && second.dirty, true);
  second.dirty = false;
  controller.request(request);
  assert.equal(controller.getState().status, "confirming");
});

test("AppShell renders the shared slots, keeps both auxiliary views and puts the portal host outside the shell", () => {
  const button = (name: string) => createElement("button", {}, name);
  const auxiliaryPane = {
    objectId: "object", active: "inspector" as const, label: "Workspace assistance",
    inspector: createElement("input", { defaultValue: "Inspector draft" }),
    agent: createElement("input", { defaultValue: "Agent draft" }),
    entry: { presentation: auxiliaryEntry, trigger: button("Reopen inspector") },
  };
  const standard = renderToStaticMarkup(createElement(AppShell, {
    l1: "Domains", l2: "Sections", oleContext: "dark", oleDensity: "compact",
    topBar: { navigation: button("Navigate"), context: "Class", actions: button("Basket") },
    auxiliaryPane, children: createElement("article", {}, "DetailPane"),
  }));
  assert.match(standard, /data-mode="standard"/);
  assert.match(standard, /--wb-l1-width:56px;--wb-l2-width:208px;--wb-top-bar-height:48px/);
  assert.match(standard, /data-slot="workbench-main"[^>]*><article>DetailPane/);
  assert.match(standard, /aria-label="Workspace assistance"[^>]*--wb-auxiliary-width:400px/);
  assert.match(standard, /value="Inspector draft"/);
  assert.match(standard, /hidden="" inert=""[^>]*><div data-slot="workbench-auxiliary-scroll"><input value="Agent draft"/);
  assert.match(standard, /<\/aside><\/div><\/div><\/div><div data-ole-context="dark" data-ole-density="compact" data-slot="workbench-portal-host"/);
  const immersive = renderToStaticMarkup(createElement(AppShell, {
    mode: "immersive", l1: "Domains", l2: "Sections",
    focusTopBar: { back: button("Return to tasks"), identity: "Review task" }, children: "Stage",
  }));
  assert.match(immersive, /--wb-l1-width:56px;--wb-l2-width:0px/);
  assert.match(immersive, /data-slot="workbench-focus-top-bar".*Return to tasks.*Review task/);
});

test("Public React providers compose into a single channel and expose guard actions and state", () => {
  function WorkbenchProbe() {
    assert.equal(useDrawerChannel().state.views.length, 0);
    assert.equal(typeof useLeaveGuard().request, "function");
    assert.equal(useLeaveGuardState().status, "idle");
    return createElement(DrawerChannelHost, { renderView: () => "Drawer" });
  }
  const html = renderToStaticMarkup(createElement(LeaveGuardProvider, {
    children: createElement(DrawerChannelProvider, { children: createElement(WorkbenchProbe) }),
  }));
  assert.equal(html, "");
});
