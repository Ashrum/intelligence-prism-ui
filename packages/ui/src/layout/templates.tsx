"use client";

import { Menu } from "@base-ui/react/menu";
import { EllipsisIcon } from "lucide-react";
import {
  useLayoutEffect, useRef, useState,
  type CSSProperties, type ReactElement, type ReactNode, type RefObject,
} from "react";
import { usePortalProps } from "../portal-scope.js";
import { computeSplitCanSideBySide, workbenchLayout } from "./contracts.js";
import { useProcessHost } from "./process-host.js";

function useLayoutWidth<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [width, setWidth] = useState<number>();
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(element.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

export interface PageHeaderAction {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  pending?: boolean;
}

export interface PageHeaderProps {
  title: string;
  /** Supply a back control only when the page registers PageHeader as its return owner. */
  back?: ReactElement;
  primaryAction?: PageHeaderAction;
  secondaryActions?: readonly PageHeaderAction[];
  overflowLabel?: string;
  tabs?: ReactNode;
  /** An optional controlled selector for the same tab state on compact widths. */
  compactTabs?: ReactNode;
  compact?: boolean;
}

function HeaderAction({ action, primary }: { action: PageHeaderAction; primary?: boolean }) {
  return (
    <button type="button" data-slot="workbench-action" data-primary={primary || undefined}
      disabled={action.disabled || action.pending} aria-busy={action.pending}
      title={action.label} onClick={action.onSelect}>
      <span>{action.label}</span>
    </button>
  );
}

function HeaderOverflow({ items, label }: { items: readonly PageHeaderAction[]; label: string }) {
  const portalProps = usePortalProps();
  if (!items.length) return null;
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger data-slot="workbench-action" aria-label={label} title={label}>
        <EllipsisIcon aria-hidden="true" size={16} />
      </Menu.Trigger>
      <Menu.Portal {...portalProps}>
        <Menu.Positioner data-slot="workbench-header-menu-positioner" align="end" sideOffset={4}>
          <Menu.Popup data-slot="workbench-header-menu">
            {items.map((item) => (
              <Menu.Item key={item.id} data-slot="workbench-header-menu-item"
                disabled={item.disabled || item.pending} onClick={item.onSelect}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function PageHeader({
  title, back, primaryAction, secondaryActions = [], overflowLabel = "更多操作",
  tabs, compactTabs, compact,
}: PageHeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const width = useLayoutWidth(ref);
  const narrow = compact ?? (width !== undefined && width < workbenchLayout.fullScreenWidth);
  const visibleSecondaryCount = narrow ? 0 : 2;
  const tabContent = narrow ? compactTabs ?? tabs : tabs ?? compactTabs;

  return (
    <header ref={ref} data-slot="workbench-page-header" data-compact={narrow || undefined}>
      <div data-slot="workbench-page-heading">
        {back && <div data-slot="workbench-page-back">{back}</div>}
        <h1 data-slot="workbench-page-title" title={title}>{title}</h1>
        {secondaryActions.slice(0, visibleSecondaryCount).map((action) => <HeaderAction key={action.id} action={action} />)}
        <HeaderOverflow items={secondaryActions.slice(visibleSecondaryCount)} label={overflowLabel} />
        {primaryAction && <HeaderAction action={primaryAction} primary />}
      </div>
      {tabContent != null && <div data-slot="workbench-page-tabs">{tabContent}</div>}
    </header>
  );
}

function TemplateHeader({ header }: { header?: PageHeaderProps }) {
  const process = useProcessHost();
  return header && !process?.ownsHeader ? <PageHeader {...header} /> : null;
}

interface TemplateProps {
  header?: PageHeaderProps;
  children: ReactNode;
}

interface PaddedTemplateProps extends TemplateProps {
  compact?: boolean;
  /** Width of the template's allocated host, before padding. */
  compactAt?: number;
}

export interface ListHeightBudget {
  fixedChromeHeight: number;
  visibleBodyHeight: number;
}

export function computeListShouldCollapse({ fixedChromeHeight, visibleBodyHeight }: ListHeightBudget): boolean {
  return fixedChromeHeight > 320 || visibleBodyHeight < 360;
}

type VerticalSpan = { top: number; bottom: number };
function occupiedHeight(spans: VerticalSpan[]) {
  let bottom = -Infinity;
  let occupied = 0;
  for (const span of spans.sort((first, second) => first.top - second.top)) {
    occupied += Math.max(0, span.bottom - Math.max(span.top, bottom));
    bottom = Math.max(bottom, span.bottom);
  }
  return occupied;
}

function visibleVerticalSpan(element: HTMLElement): VerticalSpan {
  const visual = element.ownerDocument.defaultView?.visualViewport;
  let top = visual?.offsetTop ?? 0;
  let bottom = visual ? top + visual.height : element.ownerDocument.documentElement.clientHeight;
  for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
    if (parent !== element && getComputedStyle(parent).overflowY === "visible") continue;
    const start = parent.getBoundingClientRect().top + parent.clientTop;
    top = Math.max(top, start);
    bottom = Math.min(bottom, start + parent.clientHeight);
  }
  return { top, bottom };
}

export interface LayoutListProps extends PaddedTemplateProps {
  filters?: ReactNode;
  /** Use a controlled summary or a disclosure in this slot. */
  summary?: ReactNode;
  bottomBar?: ReactNode;
  shouldCollapseTools?: (budget: ListHeightBudget) => boolean;
}

export function LayoutList({
  header, children, filters, summary, bottomBar, compact, compactAt = workbenchLayout.fullScreenWidth,
  shouldCollapseTools = computeListShouldCollapse,
}: LayoutListProps) {
  const rootRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const width = useLayoutWidth(rootRef);
  const narrow = compact ?? (width !== undefined && width < compactAt);
  const process = useProcessHost();
  const hasHeader = header != null && !process?.ownsHeader;
  const hasProcessChrome = process?.hasChrome;
  const hasTools = filters != null || summary != null;
  const [height, setHeight] = useState({ fixedChromeHeight: 0, visibleBodyHeight: Infinity, toolsHeight: 0 });
  const collapsed = shouldCollapseTools(height);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const scroll = scrollRef.current;
    if (!root || !scroll) return;
    const shell = root.closest('[data-slot="workbench-shell"]');
    const process = root.closest('[data-slot="workbench-process-host"]');
    const chrome = [
      shell?.querySelector('[data-slot="workbench-center"] > :is([data-slot="workbench-top-bar"], [data-slot="workbench-focus-top-bar"])'),
      process?.querySelector(':scope > [data-slot="workbench-process-chrome"]'),
      root.querySelector(':scope > [data-slot="workbench-page-header"]'),
      root.querySelector(':scope > [data-slot="workbench-layout-bottom"]'),
    ].filter((item): item is Element => !!item);
    const tools = toolsRef.current;
    function measure() {
      if (!scroll) return;
      const scrollTop = scroll.getBoundingClientRect().top + scroll.clientTop;
      const toolsHeight = tools?.getBoundingClientRect().height ?? 0;
      const pinnedTools = { top: scrollTop, bottom: scrollTop + toolsHeight };
      // Evaluate the expanded layout in both modes, so collapsing does not change its own trigger.
      const spans = [...chrome.map((item) => item.getBoundingClientRect()), pinnedTools];
      const body = visibleVerticalSpan(scroll);
      const obscured = occupiedHeight(spans.map(({ top, bottom }) => ({
        top: Math.max(top, body.top), bottom: Math.min(bottom, body.bottom),
      })));
      const fixedChromeHeight = occupiedHeight(spans);
      const visibleBodyHeight = Math.max(0, body.bottom - body.top - obscured);
      setHeight((before) => before.fixedChromeHeight === fixedChromeHeight &&
        before.visibleBodyHeight === visibleBodyHeight && before.toolsHeight === toolsHeight
        ? before : { fixedChromeHeight, visibleBodyHeight, toolsHeight });
    }
    const observer = new ResizeObserver(measure);
    for (const element of [root, scroll, tools, ...chrome]) {
      if (element) observer.observe(element);
    }
    const visual = window.visualViewport;
    visual?.addEventListener("resize", measure);
    visual?.addEventListener("scroll", measure);
    measure();
    return () => {
      observer.disconnect();
      visual?.removeEventListener("resize", measure);
      visual?.removeEventListener("scroll", measure);
    };
  }, [hasTools, hasHeader, bottomBar != null, hasProcessChrome]);

  return (
    <section ref={rootRef} data-slot="workbench-layout-list" data-compact={narrow || undefined}
      data-tools-collapsed={collapsed} data-fixed-chrome-height={height.fixedChromeHeight}
      data-visible-body-height={Number.isFinite(height.visibleBodyHeight) ? height.visibleBodyHeight : undefined}
      style={{ "--wb-list-tools-height": `${collapsed ? 0 : height.toolsHeight}px` } as CSSProperties}>
      <TemplateHeader header={header && { ...header, compact: header.compact ?? (narrow || collapsed) }} />
      <div ref={scrollRef} data-slot="workbench-list-scroll">
        {hasTools && (
          <div ref={toolsRef} data-slot="workbench-list-tools">
            {filters}
            {summary}
          </div>
        )}
        <div data-slot="workbench-list-body">{children}</div>
      </div>
      {bottomBar != null && <footer data-slot="workbench-layout-bottom">{bottomBar}</footer>}
    </section>
  );
}

export type LayoutSplitView = "selection" | "detail";
export interface LayoutSplitProps extends TemplateProps {
  list: ReactNode;
  listLabel?: string;
  detailLabel?: string;
  listWidth?: number;
  detailMinWidth?: number;
  contentMinWidth?: number;
  /** Use when AppShell's layout budget has already moved Split to single view. */
  forceSingleView?: boolean;
  singleView?: LayoutSplitView;
  onSingleViewChange?: (view: LayoutSplitView) => void;
}

export function LayoutSplit({
  header, list, children, listLabel = "对象选择", detailLabel = "详情", listWidth = 280,
  detailMinWidth = 480, contentMinWidth, forceSingleView = false, singleView, onSingleViewChange,
}: LayoutSplitProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const pendingFocus = useRef<LayoutSplitView>(undefined);
  const lastPaneFocus = useRef<HTMLElement>(null);
  const width = useLayoutWidth(gridRef);
  const [localView, setLocalView] = useState<LayoutSplitView>("detail");
  const view = singleView ?? localView;
  const registeredListWidth = Math.min(340, Math.max(260, listWidth));
  const registeredDetailMinWidth = Math.max(480, detailMinWidth);
  const beside = !forceSingleView && width !== undefined && computeSplitCanSideBySide(width, {
    listWidth: registeredListWidth, detailMinWidth: registeredDetailMinWidth, contentMinWidth,
  });

  useLayoutEffect(() => {
    if (beside) return;
    const activePane = (view === "selection" ? listRef : detailRef).current;
    if (!activePane) return;
    const doc = activePane.ownerDocument;
    const previousFocus = lastPaneFocus.current;
    const sourceHidden = previousFocus?.closest("[hidden]") &&
      (doc.activeElement === previousFocus || doc.activeElement === doc.body);
    if (pendingFocus.current === view || sourceHidden) {
      pendingFocus.current = undefined;
      activePane.focus();
    }
  }, [view, beside]);

  function changeView(next: LayoutSplitView) {
    pendingFocus.current = next;
    if (singleView === undefined) setLocalView(next);
    onSingleViewChange?.(next);
  }

  return (
    <section data-slot="workbench-layout-split">
      <TemplateHeader header={header} />
      {!beside && (
        <div data-slot="workbench-split-switch">
          <button data-slot="workbench-action" type="button" onClick={() => changeView(view === "detail" ? "selection" : "detail")}>
            {view === "detail" ? listLabel : detailLabel}
          </button>
        </div>
      )}
      <div ref={gridRef} data-slot="workbench-split-grid" data-split={beside ? "side-by-side" : "single-view"}
        onFocusCapture={(event) => { lastPaneFocus.current = event.target; }}
        data-content-net-width={width}
        style={{
          "--wb-split-list": `${registeredListWidth}px`,
          "--wb-split-detail-min": `${registeredDetailMinWidth}px`,
        } as CSSProperties}>
        <section ref={listRef} tabIndex={-1} aria-label={listLabel} data-slot="workbench-split-list"
          hidden={!beside && view !== "selection"} inert={!beside && view !== "selection"}>
          {list}
        </section>
        {beside && <div data-slot="workbench-split-divider" aria-hidden="true" />}
        <section ref={detailRef} tabIndex={-1} aria-label={detailLabel} data-slot="workbench-split-detail"
          hidden={!beside && view !== "detail"} inert={!beside && view !== "detail"}>
          {children}
        </section>
      </div>
    </section>
  );
}

const rulerFullWidth = 1024;

export interface LayoutFocusProps extends TemplateProps {
  edgeToEdge?: boolean;
  ruler?: { top: ReactNode; left?: ReactNode };
  hideLeftRuler?: boolean;
  toolbar?: ReactNode;
  toolbarHeight?: 36 | 37 | 38 | 39 | 40;
}

export function LayoutFocus({
  header, children, edgeToEdge = false, ruler, hideLeftRuler = false, toolbar, toolbarHeight = 40,
}: LayoutFocusProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const width = useLayoutWidth(frameRef);
  const top = ruler && width !== undefined && width >= workbenchLayout.fullScreenWidth;
  const left = top && ruler.left != null && !hideLeftRuler && width >= rulerFullWidth;
  return (
    <section data-slot="workbench-layout-focus" data-edge-to-edge={edgeToEdge || undefined}>
      <TemplateHeader header={header} />
      <div ref={frameRef} data-slot="workbench-focus-frame" data-ruler={left ? "full" : top ? "top" : "hidden"}
        data-host-width={width}>
        {top && <div data-slot="workbench-focus-ruler-top" aria-hidden="true">{ruler.top}</div>}
        {left && <div data-slot="workbench-focus-ruler-left" aria-hidden="true">{ruler.left}</div>}
        <div data-slot="workbench-focus-stage">{children}</div>
      </div>
      {toolbar != null && (
        <footer data-slot="workbench-focus-toolbar" style={{ "--wb-focus-toolbar-height": `${toolbarHeight}px` } as CSSProperties}>
          {toolbar}
        </footer>
      )}
    </section>
  );
}

export interface FormBudget {
  columns?: 1 | 2;
  maxWidth?: number;
  anchor?: boolean;
  anchorGap?: number;
  /** Minimum form width alongside an expanded anchor for a single-column page. Defaults to 440px. */
  minSingleColumnWidth?: number;
  /** Minimum usable form width for two columns. Defaults to 640px. */
  minTwoColumnWidth?: number;
}

export function computeFormLayout(contentNetWidth: number, {
  columns = 1, maxWidth = Infinity, anchor = false, anchorGap = 24,
  minSingleColumnWidth = 440, minTwoColumnWidth = 640,
}: FormBudget = {}) {
  const anchorWidth = 180;
  const width = Math.max(0, contentNetWidth);
  const gap = Math.max(0, anchorGap);
  const wantedMin = columns === 2 ? minTwoColumnWidth : minSingleColumnWidth;
  const anchorVisible = anchor && width >= anchorWidth + gap + wantedMin;
  const remaining = width - (anchorVisible ? anchorWidth + gap : 0);
  const actualColumns = columns === 2 && Math.min(remaining, maxWidth) >= minTwoColumnWidth ? 2 : 1;
  return {
    columns: actualColumns,
    formWidth: Math.max(0, Math.min(remaining, maxWidth, actualColumns === 2 ? 960 : 760)),
    anchorWidth: anchorVisible ? anchorWidth : 0,
    anchorGap: anchorVisible ? gap : 0,
  };
}

export interface LayoutFormProps extends PaddedTemplateProps, Omit<FormBudget, "anchor"> {
  anchor?: ReactNode;
  anchorLabel?: string;
  bottomBar?: ReactNode;
}

export function LayoutForm({
  header, children, compact, compactAt = workbenchLayout.fullScreenWidth, anchor, anchorLabel = "表单导航",
  bottomBar, columns, maxWidth, anchorGap, minSingleColumnWidth, minTwoColumnWidth,
}: LayoutFormProps) {
  const rootRef = useRef<HTMLElement>(null);
  const netRef = useRef<HTMLDivElement>(null);
  const width = useLayoutWidth(rootRef);
  const contentNetWidth = useLayoutWidth(netRef);
  const narrow = compact ?? (width !== undefined && width < compactAt);
  const layout = computeFormLayout(contentNetWidth ?? 0, {
    columns, maxWidth, anchor: anchor != null, anchorGap, minSingleColumnWidth, minTwoColumnWidth,
  });
  return (
    <section ref={rootRef} data-slot="workbench-layout-form" data-compact={narrow || undefined}>
      <TemplateHeader header={header && { ...header, compact: header.compact ?? narrow }} />
      <div data-slot="workbench-form-scroll">
        <div ref={netRef} data-slot="workbench-form-net" data-content-net-width={contentNetWidth}
          style={{
            "--wb-form-width": contentNetWidth === undefined ? "100%" : `${layout.formWidth}px`,
            "--wb-form-anchor-width": `${layout.anchorWidth}px`,
            "--wb-form-anchor-gap": `${layout.anchorGap}px`,
          } as CSSProperties}>
          {anchor != null && <nav data-slot="workbench-form-anchor" hidden={!layout.anchorWidth} aria-label={anchorLabel}>{anchor}</nav>}
          <div data-slot="workbench-form-fields" data-columns={layout.columns}>{children}</div>
        </div>
      </div>
      {bottomBar != null && <footer data-slot="workbench-layout-bottom">{bottomBar}</footer>}
    </section>
  );
}
