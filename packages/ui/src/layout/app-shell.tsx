"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { PortalScope, useOlePortalAttributes, type OlePortalContext } from "../portal-scope.js";
import {
  auxiliaryPaneWidths, degradeLayout, workbenchLayout,
  type AppShellMode, type AuxiliaryPaneEntry, type AuxiliaryPaneSize, type LayoutBudget, type LayoutBudgetResult,
} from "./contracts.js";
import { useAuxiliaryPaneYielded } from "./drawer-channel.js";

export interface TopBarProps {
  navigation?: ReactNode;
  context?: ReactNode;
  actions?: ReactNode;
}

export function TopBar({ navigation, context, actions }: TopBarProps) {
  return (
    <header data-slot="workbench-top-bar">
      <div data-slot="workbench-top-bar-navigation">{navigation}</div>
      <div data-slot="workbench-top-bar-context">{context}</div>
      <div data-slot="workbench-top-bar-actions">{actions}</div>
    </header>
  );
}

export interface FocusTopBarProps {
  back: ReactElement;
  identity: ReactNode;
  actions?: ReactNode;
}

export function FocusTopBar({ back, identity, actions }: FocusTopBarProps) {
  return (
    <header data-slot="workbench-focus-top-bar">
      <div data-slot="workbench-top-bar-navigation">{back}</div>
      <div data-slot="workbench-top-bar-context">{identity}</div>
      <div data-slot="workbench-top-bar-actions">{actions}</div>
    </header>
  );
}

export interface MainViewportProps {
  children: ReactNode;
  /** Page-owned scrolling is used for independently scrollable columns or stages. */
  scroll?: "viewport" | "page";
}

export function MainViewport({ children, scroll = "viewport" }: MainViewportProps) {
  return <main data-slot="workbench-main" data-scroll={scroll} tabIndex={-1}>{children}</main>;
}

export interface AuxiliaryPaneProps {
  size?: AuxiliaryPaneSize;
  /** Commit object changes through the leave guard if the current edit can be lost. */
  objectId: string;
  active: "inspector" | "agent";
  inspector: ReactNode;
  agent: ReactNode;
  label: string;
  hidden?: boolean;
}

function AuxiliaryView({ children, hidden }: { children: ReactNode; hidden: boolean }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <div data-slot="workbench-auxiliary-view" hidden={hidden} inert={hidden}>
      <PortalScope container={host}>
        <div data-slot="workbench-auxiliary-scroll">{children}</div>
      </PortalScope>
      <div ref={setHost} />
    </div>
  );
}

/** Keeps both same-object views mounted and provides a single visible auxiliary region. */
export function AuxiliaryPane({ size = "md", objectId, active, inspector, agent, label, hidden = false }: AuxiliaryPaneProps) {
  return (
    <aside
      data-slot="workbench-auxiliary" data-size={size} aria-label={label} hidden={hidden} inert={hidden}
      style={{ "--wb-auxiliary-width": `${auxiliaryPaneWidths[size]}px` } as CSSProperties}
    >
      <AuxiliaryView key={`inspector:${objectId}`} hidden={active !== "inspector"}>{inspector}</AuxiliaryView>
      <AuxiliaryView key={`agent:${objectId}`} hidden={active !== "agent"}>{agent}</AuxiliaryView>
    </aside>
  );
}

export interface AppShellAuxiliaryPane extends Omit<AuxiliaryPaneProps, "hidden"> {
  open?: boolean;
  minSize?: AuxiliaryPaneSize;
  canUseSize?: (size: AuxiliaryPaneSize) => boolean;
  /** Render a reachable trigger wired to this registered presentation. */
  entry: { presentation: AuxiliaryPaneEntry; trigger: ReactElement };
}

export type AppShellBudget = Omit<LayoutBudget,
  "width" | "mode" | "l1Width" | "l2Width" | "l2PreferredExpanded" | "auxiliaryPane"
>;

interface AppShellBaseProps extends OlePortalContext {
  /** A render function can apply the shell's split and ruler decisions to the page. */
  children: ReactNode | ((layout: LayoutBudgetResult) => ReactNode);
  l1?: ReactNode;
  l1Label?: string;
  l2?: ReactNode;
  l2Label?: string;
  l2PreferredExpanded?: boolean;
  /** Shared Drawer trigger for the navigation rails that are out of flow. */
  navigationEntry?: ReactElement;
  auxiliaryPane?: AppShellAuxiliaryPane;
  budget?: AppShellBudget;
  scroll?: MainViewportProps["scroll"];
  /** Shell-level overlays, including the global Toast and channel host. */
  overlays?: ReactNode;
}

export type AppShellProps = AppShellBaseProps & (
  | { mode?: "standard"; topBar?: TopBarProps; focusTopBar?: FocusTopBarProps }
  | { mode: "immersive"; topBar?: TopBarProps; focusTopBar: FocusTopBarProps }
);

function shellLayout(
  width: number, mode: AppShellMode, props: AppShellBaseProps, auxiliaryPaneYielded: boolean,
): LayoutBudgetResult {
  const { budget, l1, l2, auxiliaryPane } = props;
  const l2PreferredExpanded = props.l2PreferredExpanded ?? mode === "standard";
  const auxiliaryOpen = auxiliaryPane && auxiliaryPane.open !== false && !auxiliaryPaneYielded;
  const mobile = width < workbenchLayout.fullScreenWidth;
  const desktop = width >= workbenchLayout.desktopWidth;
  const l2InFlow = desktop && l2 && l2PreferredExpanded &&
    (width >= workbenchLayout.wideDesktopWidth || (!auxiliaryOpen && mode === "standard"));
  const layout = degradeLayout({
    ...budget, width, mode, l2PreferredExpanded,
    l1Width: !mobile && l1 ? workbenchLayout.l1Width : 0,
    l2Width: l2InFlow ? workbenchLayout.l2Width : 0,
    auxiliaryPane: desktop && auxiliaryOpen ? { ...auxiliaryPane, entry: auxiliaryPane.entry.presentation } : undefined,
  });
  if (mobile && layout.split) layout.split = "single-view";
  if (auxiliaryPane && (!desktop || auxiliaryPaneYielded || !auxiliaryOpen)) {
    layout.auxiliaryPane = auxiliaryPane.entry.presentation;
  }
  return layout;
}

function AppShellContents(props: AppShellProps) {
  const {
    mode = "standard", l1, l1Label = "Business areas", l2, l2Label = "Section navigation",
    auxiliaryPane, navigationEntry, topBar, focusTopBar, scroll, children, overlays,
  } = props;
  const attributes = useOlePortalAttributes();
  const yielded = useAuxiliaryPaneYielded();
  const shellRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(workbenchLayout.wideDesktopWidth);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const measure = () => setWidth(shell.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  const layout = shellLayout(width, mode, props, yielded);
  const inlineAuxiliary = layout.auxiliaryPane?.kind === "inline" ? layout.auxiliaryPane : null;
  const navigationFallback = (l1 && layout.l1Width === 0) ||
    (l2 && layout.l2Width === 0 && (mode === "standard" || layout.l2PreferredExpanded || width < workbenchLayout.fullScreenWidth));
  const navigationTrigger = navigationFallback ? navigationEntry : null;
  const auxiliaryTrigger = auxiliaryPane && !inlineAuxiliary ? auxiliaryPane.entry.trigger : null;

  return (
    <PortalScope container={host}>
      <div
        {...attributes}
        data-slot="workbench-shell" data-mode={mode} ref={shellRef}
        style={{
          "--wb-l1-width": `${layout.l1Width}px`,
          "--wb-l2-width": `${layout.l2Width}px`,
          "--wb-top-bar-height": `${workbenchLayout.topBarHeight}px`,
        } as CSSProperties}
      >
        {l1 && <nav data-slot="workbench-l1" aria-label={l1Label} hidden={layout.l1Width === 0}>{l1}</nav>}
        {l2 && <nav data-slot="workbench-l2" aria-label={l2Label} hidden={layout.l2Width === 0}>{l2}</nav>}
        <div data-slot="workbench-center">
          {mode === "immersive" && focusTopBar
            ? <FocusTopBar {...focusTopBar} actions={<>{focusTopBar.actions}{navigationTrigger}{auxiliaryTrigger}</>} />
            : <TopBar {...topBar} navigation={<>{topBar?.navigation}{navigationTrigger}</>}
                actions={<>{topBar?.actions}{auxiliaryTrigger}</>} />}
          <div data-slot="workbench-content">
            <MainViewport scroll={scroll}>{typeof children === "function" ? children(layout) : children}</MainViewport>
            {auxiliaryPane && <AuxiliaryPane {...auxiliaryPane} size={inlineAuxiliary?.size ?? auxiliaryPane.size} hidden={!inlineAuxiliary} />}
          </div>
        </div>
      </div>
      <div {...attributes} data-slot="workbench-portal-host" ref={setHost} />
      {overlays}
    </PortalScope>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <PortalScope oleContext={props.oleContext} oleDensity={props.oleDensity}>
      <AppShellContents {...props} />
    </PortalScope>
  );
}
