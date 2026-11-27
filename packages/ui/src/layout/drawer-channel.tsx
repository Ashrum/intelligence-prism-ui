"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import {
  createContext, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore,
  type CSSProperties, type ReactNode, type RefObject,
} from "react";
import { PortalScope, usePortalProps, type PortalContainer } from "../portal-scope.js";
import { useMediaQuery } from "../use-media-query.js";
import { drawerWidths, workbenchLayout, type DrawerSize } from "./contracts.js";
import { useOptionalLeaveGuard } from "./leave-guard-context.js";
import { initialLeaveGuardState, isLeaveGuardBlocking, type LeaveGuardHost } from "./leave-guard.js";

export interface DrawerViewSnapshot {
  taskRef?: string;
  objectId?: string;
  step?: string;
  draft?: unknown;
  scrollTop?: number;
  focusTarget?: () => HTMLElement | null;
}

export interface DrawerChannelView extends DrawerViewSnapshot {
  id: string;
  host: string;
  kind: "navigation" | "selection" | "auxiliary" | "business";
  size: DrawerSize;
  title: string;
  mode: "readonly" | "editing";
  allowBackdropExit?: boolean;
  /** Reports the live edit sessions that would be lost on exit. Requires LeaveGuardProvider. */
  readLeave?: (request: DrawerExitRequest) => { valid: boolean; hosts: readonly LeaveGuardHost[] };
}

type DrawerViews = readonly [] | readonly [DrawerChannelView] | readonly [DrawerChannelView, DrawerChannelView];

export interface DrawerChannelState {
  views: DrawerViews;
  auxiliaryPaneYielded: boolean;
  generation: number;
}

export type DrawerExitReason = "topbar" | "backdrop" | "escape" | "system";
type ExitPhase = "idle" | "confirming" | "saving" | "blocked";

export interface DrawerExitRequest {
  viewId: string;
  generation: number;
  action: "close" | "back";
  reason: DrawerExitReason;
}

export const initialDrawerChannelState: DrawerChannelState = { views: [], auxiliaryPaneYielded: false, generation: 0 };

export function getDrawerExitPolicy(state: DrawerChannelState, phase: ExitPhase = "idle") {
  const active = state.views.at(-1);
  const available = !!active && phase === "idle";
  return {
    action: !active ? null : state.views.length === 2 ? "back" as const : "close" as const,
    topBar: available,
    escape: available,
    backdrop: available && (active.allowBackdropExit ?? active.mode === "readonly"),
  };
}

export function getDrawerExitRequest(
  state: DrawerChannelState, reason: DrawerExitReason, phase: ExitPhase = "idle", repeat = false,
): DrawerExitRequest | undefined {
  const policy = getDrawerExitPolicy(state, phase);
  const active = state.views.at(-1);
  if (!active || !policy.action) return;
  const allowed = reason === "topbar" ? policy.topBar : reason === "backdrop" ? policy.backdrop : policy.escape;
  if (!allowed || (reason === "escape" && repeat)) return;
  return { viewId: active.id, generation: state.generation, action: policy.action, reason };
}

export type DrawerChannelEvent =
  | { type: "openRoot"; view: DrawerChannelView }
  | { type: "pushChild"; fromViewId: string; view: DrawerChannelView; snapshot?: DrawerViewSnapshot }
  | { type: "updateActive"; viewId: string; snapshot: DrawerViewSnapshot }
  | { type: "applyExit"; request: DrawerExitRequest }
  | { type: "invalidateView"; viewId: string };

export function drawerChannelReducer(state: DrawerChannelState, event: DrawerChannelEvent): DrawerChannelState {
  const [root, child] = state.views;
  const active = child ?? root;
  function setViews(views: DrawerViews, newGeneration = true): DrawerChannelState {
    return {
      views,
      auxiliaryPaneYielded: views.some((view) => view.kind === "business"),
      generation: state.generation + Number(newGeneration),
    };
  }
  switch (event.type) {
    case "openRoot":
      return root ? state : setViews([event.view]);
    case "pushChild":
      if (!root || child || root.id !== event.fromViewId || root.id === event.view.id) return state;
      return setViews([{ ...root, ...event.snapshot }, event.view]);
    case "updateActive":
      if (!root || active?.id !== event.viewId) return state;
      return setViews(child ? [root, { ...child, ...event.snapshot }] : [{ ...root, ...event.snapshot }], false);
    case "applyExit":
      if (!root || active?.id !== event.request.viewId || state.generation !== event.request.generation) return state;
      if (child) return event.request.action === "back" ? setViews([root]) : state;
      return event.request.action === "close" ? setViews([]) : state;
    case "invalidateView":
      if (root?.id === event.viewId) return setViews([]);
      if (root && child?.id === event.viewId) return setViews([root]);
      return state;
  }
}

interface DrawerChannel {
  state: DrawerChannelState;
  openRoot: (view: DrawerChannelView) => void;
  pushChild: (fromViewId: string, view: DrawerChannelView, snapshot?: DrawerViewSnapshot) => void;
  updateActive: (viewId: string, snapshot: DrawerViewSnapshot) => void;
  requestExit: (reason: DrawerExitReason, repeat?: boolean) => void;
  /** Close an invalidated root and optionally direct focus to the newly active editing field. */
  invalidateView: (viewId: string, focusTarget?: () => HTMLElement | null) => void;
}

interface DrawerChannelContextValue extends DrawerChannel {
  bodyRef: RefObject<HTMLDivElement | null>;
  returnFocusRef: RefObject<HTMLElement | null>;
  exitFocusRef: RefObject<(() => HTMLElement | null) | undefined>;
  fallbackFocusRef: RefObject<HTMLElement | null>;
  exitPhase: ExitPhase;
}

const DrawerChannelContext = createContext<DrawerChannelContextValue | null>(null);
const readIdleGuard = () => initialLeaveGuardState;
const subscribeIdleGuard = () => () => {};

function focusedElement(): HTMLElement | null {
  const element = typeof document === "undefined" ? null : document.activeElement;
  const ownerHTMLElement = element?.ownerDocument.defaultView?.HTMLElement;
  return ownerHTMLElement && element instanceof ownerHTMLElement ? element : null;
}

export function DrawerChannelProvider({ children }: { children: ReactNode }) {
  const guard = useOptionalLeaveGuard();
  const guardState = useSyncExternalStore(
    guard?.subscribe ?? subscribeIdleGuard, guard?.getState ?? readIdleGuard, readIdleGuard,
  );
  const [state, setState] = useState(initialDrawerChannelState);
  const stateRef = useRef(state);
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement>(null);
  const exitFocusRef = useRef<() => HTMLElement | null>(undefined);
  const fallbackFocusRef = useRef<HTMLElement>(null);
  const exitIntentRef = useRef<string | null>(null);
  const exitSequence = useRef(0);
  const exitPhase = guardState.status === "failed" ? "idle" : guardState.status;

  function send(event: DrawerChannelEvent) {
    const next = drawerChannelReducer(stateRef.current, event);
    stateRef.current = next;
    setState(next);
  }

  const value: DrawerChannelContextValue = {
    state, bodyRef, returnFocusRef, exitFocusRef, fallbackFocusRef, exitPhase,
    openRoot(view) {
      if (stateRef.current.views.length || isLeaveGuardBlocking(guard?.getState() ?? initialLeaveGuardState)) return;
      const focused = focusedElement();
      returnFocusRef.current = focused;
      exitFocusRef.current = undefined;
      fallbackFocusRef.current = focused?.closest('[data-slot="workbench-shell"]')
        ?.querySelector<HTMLElement>('[data-slot="workbench-main"]') ?? null;
      send({ type: "openRoot", view });
    },
    pushChild(fromViewId, view, snapshot) {
      if (isLeaveGuardBlocking(guard?.getState() ?? initialLeaveGuardState)) return;
      const focused = focusedElement();
      send({
        type: "pushChild", fromViewId, view,
        snapshot: {
          ...(bodyRef.current && { scrollTop: bodyRef.current.scrollTop }),
          ...(bodyRef.current?.contains(focused) && { focusTarget: () => focused }),
          ...snapshot,
        },
      });
    },
    updateActive(viewId, snapshot) {
      send({ type: "updateActive", viewId, snapshot });
    },
    requestExit(reason, repeat) {
      if (isLeaveGuardBlocking(guard?.getState() ?? initialLeaveGuardState)) return;
      const current = stateRef.current;
      const request = getDrawerExitRequest(current, reason, "idle", repeat);
      const active = current.views.at(-1);
      if (!request || !active) return;
      const complete = () => send({ type: "applyExit", request });
      if (!active.readLeave) {
        complete();
        return;
      }
      if (!guard) throw new Error("A Drawer edit session requires LeaveGuardProvider");
      const id = `drawer-exit:${++exitSequence.current}`;
      const target = request.action === "back" ? current.views[0]?.id ?? "" : "drawer:closed";
      exitIntentRef.current = id;
      guard.request({
        id, target, navigate: complete,
        read() {
          const live = stateRef.current;
          const liveView = live.views.at(-1);
          if (live.generation !== request.generation || liveView?.id !== request.viewId ||
            liveView.objectId !== active.objectId || liveView.host !== active.host) {
            return { intentId: id, target, hosts: [], valid: false };
          }
          const result = liveView.readLeave?.(request);
          return { intentId: id, target, hosts: result?.hosts ?? [], valid: !!result?.valid };
        },
      });
    },
    invalidateView(viewId, focusTarget) {
      const before = stateRef.current;
      if (before.views[0]?.id === viewId) exitFocusRef.current = focusTarget;
      send({ type: "invalidateView", viewId });
      const leave = guard?.getState();
      if (stateRef.current !== before && leave && "pending" in leave && leave.pending.intent.id === exitIntentRef.current) {
        guard?.invalidate(leave.pending.token);
      }
    },
  };
  return <DrawerChannelContext.Provider value={value}>{children}</DrawerChannelContext.Provider>;
}

export function useDrawerChannel(): DrawerChannel {
  const channel = useContext(DrawerChannelContext);
  if (!channel) throw new Error("useDrawerChannel requires DrawerChannelProvider");
  return channel;
}

export function useAuxiliaryPaneYielded(): boolean {
  return useContext(DrawerChannelContext)?.state.auxiliaryPaneYielded ?? false;
}

export interface DrawerChannelHostProps {
  renderView: (view: DrawerChannelView) => ReactNode;
  renderFooter?: (view: DrawerChannelView) => ReactNode;
  /** Allows a second-level leave confirmation to be nested in the active modality. */
  overlay?: ReactNode;
  closeLabel?: string;
  backLabel?: string;
  /** Stable fallback when the opening control is no longer available. */
  returnFocus?: () => HTMLElement | null;
  container?: PortalContainer;
}

function usableFocus(element: HTMLElement | null | undefined): element is HTMLElement {
  return !!element?.isConnected && !!element.getClientRects().length &&
    !element.closest('[hidden], [inert], :disabled, [aria-disabled="true"]') &&
    element.ownerDocument.defaultView?.getComputedStyle(element).visibility === "visible";
}

function DrawerViewBody({
  active, bodyRef, children, footer,
}: {
  active: boolean;
  bodyRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);
  return (
    <div data-slot="workbench-drawer-view" hidden={!active} inert={!active}>
      <PortalScope container={portalHost}>
        <DrawerPrimitive.Content ref={active ? bodyRef : undefined} data-slot="workbench-drawer-body">
          {children}
        </DrawerPrimitive.Content>
        {footer != null && <footer data-slot="workbench-drawer-footer">{footer}</footer>}
      </PortalScope>
      <div ref={setPortalHost} />
    </div>
  );
}

export function DrawerChannelHost({
  renderView, renderFooter, overlay, closeLabel = "Close", backLabel = "Back", returnFocus, container,
}: DrawerChannelHostProps) {
  const channel = useContext(DrawerChannelContext);
  if (!channel) throw new Error("DrawerChannelHost requires DrawerChannelProvider");
  const { state, requestExit, bodyRef, returnFocusRef, exitFocusRef, fallbackFocusRef, exitPhase } = channel;
  const active = state.views.at(-1);
  const policy = getDrawerExitPolicy(state, exitPhase);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previousActive = useRef<string>(undefined);
  const [overlayHost, setOverlayHost] = useState<HTMLDivElement | null>(null);
  const portalProps = usePortalProps({ container });
  const desktop = useMediaQuery(`(min-width: ${workbenchLayout.desktopWidth}px)`);
  const compactOrWider = useMediaQuery(`(min-width: ${workbenchLayout.fullScreenWidth}px)`);
  const viewport = desktop ? "desktop" : compactOrWider ? "compact" : "mobile";

  function activeFocus() {
    const target = active?.focusTarget?.();
    return usableFocus(target) ? target : buttonRef.current;
  }

  useLayoutEffect(() => {
    const previous = previousActive.current;
    previousActive.current = active?.id;
    if (!active || !previous || previous === active.id) return;
    if (bodyRef.current) bodyRef.current.scrollTop = active.scrollTop ?? 0;
    activeFocus()?.focus({ preventScroll: true });
  }, [active, bodyRef]);

  return (
    <DrawerPrimitive.Root
      open={!!active}
      modal
      swipeDirection="right"
      disablePointerDismissal={!policy.backdrop}
      onOpenChange={(open, details) => {
        if (open) return;
        details.cancel();
        if (details.reason === "escape-key") requestExit("escape", details.event.repeat);
        if (details.reason === "outside-press") requestExit("backdrop");
        if (details.reason === "close-watcher") requestExit("system");
      }}
    >
      <DrawerPrimitive.Portal {...portalProps} data-slot="workbench-drawer-portal">
        <DrawerPrimitive.Backdrop data-slot="workbench-drawer-backdrop" />
        <DrawerPrimitive.Viewport data-slot="workbench-drawer-viewport">
          <DrawerPrimitive.Popup
            data-slot="workbench-drawer"
            data-size={active?.size}
            data-viewport={viewport}
            aria-modal="true"
            data-base-ui-swipe-ignore=""
            style={{ "--wb-drawer-size": `${drawerWidths[active?.size ?? "md"]}px` } as CSSProperties}
            initialFocus={() => {
              if (bodyRef.current && active?.scrollTop !== undefined) bodyRef.current.scrollTop = active.scrollTop;
              return activeFocus() ?? true;
            }}
            finalFocus={() => {
              const destination = exitFocusRef.current?.();
              if (usableFocus(destination)) return destination;
              if (usableFocus(returnFocusRef.current)) return returnFocusRef.current;
              const fallback = returnFocus?.();
              if (usableFocus(fallback)) return fallback;
              return usableFocus(fallbackFocusRef.current) ? fallbackFocusRef.current : true;
            }}
          >
            {active && (
              <header data-slot="workbench-drawer-header">
                {policy.action === "back" && (
                  <button ref={buttonRef} type="button" aria-label={backLabel} onClick={() => requestExit("topbar")}>
                    <ArrowLeftIcon aria-hidden="true" />
                  </button>
                )}
                <DrawerPrimitive.Title title={active.title}>{active.title}</DrawerPrimitive.Title>
                {policy.action === "close" && (
                  <button ref={buttonRef} type="button" aria-label={closeLabel} onClick={() => requestExit("topbar")}>
                    <XIcon aria-hidden="true" />
                  </button>
                )}
              </header>
            )}
            {state.views.map((view) => (
              <DrawerViewBody key={view.id} active={view === active} bodyRef={bodyRef} footer={renderFooter?.(view)}>
                {renderView(view)}
              </DrawerViewBody>
            ))}
            {overlay && (
              <>
                <div ref={setOverlayHost} data-slot="workbench-drawer-overlay-host" />
                <PortalScope container={overlayHost}>{overlay}</PortalScope>
              </>
            )}
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Viewport>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
