"use client";

import { createContext, useCallback, useContext, useId, useRef, type ReactElement } from "react";
import {
  Group, Panel, Separator, useParentGroup,
  type GroupProps, type Layout, type PanelImperativeHandle, type PanelProps, type SeparatorProps,
} from "react-resizable-panels";
import { cn } from "./cn.js";

interface RegisteredPanel {
  handle: PanelImperativeHandle;
  defaultSize: PanelProps["defaultSize"];
  disabled: boolean;
}

const PanelsContext = createContext<{
  panels: Map<string, RegisteredPanel>;
  initialLayout: React.RefObject<Layout | undefined>;
  defaultLayout: Layout | undefined;
  disabled: boolean;
} | null>(null);

export type ResizablePanelGroupProps = GroupProps;

export function ResizablePanelGroup({
  children, className, defaultLayout, disabled = false, onLayoutChange, ...props
}: ResizablePanelGroupProps): ReactElement {
  const panels = useRef(new Map<string, RegisteredPanel>());
  const initialLayout = useRef<Layout>(undefined);
  return (
    <PanelsContext.Provider value={{ panels: panels.current, initialLayout, defaultLayout, disabled }}>
      <Group
        className={cn("min-h-0 min-w-0", className)}
        data-slot="resizable-panel-group"
        defaultLayout={defaultLayout}
        disabled={disabled}
        onLayoutChange={(layout) => {
          if (Object.keys(layout).length) initialLayout.current ??= { ...layout };
          onLayoutChange?.(layout);
        }}
        {...props}
      >
        {children}
      </Group>
    </PanelsContext.Provider>
  );
}

export type ResizablePanelProps = PanelProps;

export function ResizablePanel({
  id: idProp, panelRef, defaultSize, disabled = false, ...props
}: ResizablePanelProps): ReactElement {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const panels = useContext(PanelsContext)?.panels;
  const registerPanel = useCallback((handle: PanelImperativeHandle | null) => {
    if (handle) panels?.set(id, { handle, defaultSize, disabled });
    else panels?.delete(id);

    if (typeof panelRef === "function") {
      const cleanup = panelRef(handle);
      if (typeof cleanup === "function") return () => {
        panels?.delete(id);
        cleanup();
      };
    } else if (panelRef) {
      panelRef.current = handle;
    }
  }, [panels, id, defaultSize, disabled, panelRef]);

  return <Panel data-slot="resizable-panel" id={id} panelRef={registerPanel} defaultSize={defaultSize} disabled={disabled} {...props} />;
}

export interface ResizableHandleProps extends SeparatorProps {
  keyboardStep?: number;
  largeKeyboardStep?: number;
}

export function ResizableHandle({
  className, disabled, disableDoubleClick, keyboardStep = 8, largeKeyboardStep = 24,
  onKeyDownCapture, onDoubleClick, ...props
}: ResizableHandleProps): ReactElement {
  const parent = useParentGroup();
  const context = useContext(PanelsContext);
  const isDisabled = disabled || context?.disabled;

  function reset(element: HTMLDivElement) {
    const id = element.getAttribute("aria-controls");
    if (!id || !context || isDisabled) return;
    const panel = context.panels.get(id);
    if (!panel || panel.disabled) return;
    const percentage = context.defaultLayout?.[id];
    const initialPercentage = context.initialLayout.current?.[id];
    const size = percentage !== undefined ? `${percentage}%` : panel.defaultSize;
    if (size !== undefined) panel.handle.resize(size);
    else if (initialPercentage !== undefined) panel.handle.resize(`${initialPercentage}%`);
  }

  return (
    <Separator
      aria-label="Resize panels"
      className={cn(
        "relative grid place-items-center rounded-sm bg-card text-card-foreground outline-none after:pointer-events-none after:rounded-full after:bg-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring data-[separator=active]:after:bg-ring data-[separator=hover]:after:bg-ring aria-disabled:cursor-default",
        "aria-[orientation=vertical]:w-5 aria-[orientation=vertical]:cursor-col-resize aria-[orientation=vertical]:border-x aria-[orientation=vertical]:after:h-8 aria-[orientation=vertical]:after:w-0.5 aria-[orientation=horizontal]:h-5 aria-[orientation=horizontal]:cursor-row-resize aria-[orientation=horizontal]:border-y aria-[orientation=horizontal]:after:h-0.5 aria-[orientation=horizontal]:after:w-8",
        className,
      )}
      data-slot="resizable-handle"
      disabled={isDisabled}
      disableDoubleClick
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        if (!disableDoubleClick && !event.defaultPrevented) reset(event.currentTarget);
      }}
      onKeyDownCapture={(event) => {
        onKeyDownCapture?.(event);
        if (event.defaultPrevented || isDisabled || !parent || !context || event.target !== event.currentTarget) return;
        const element = event.currentTarget;
        if (event.key === "Enter") {
          event.preventDefault();
          reset(element);
          return;
        }

        // Home, End, F6, and pointer capture use the upstream Separator behavior.
        const horizontal = parent.orientation === "horizontal";
        const backward = horizontal ? "ArrowLeft" : "ArrowUp";
        const forward = horizontal ? "ArrowRight" : "ArrowDown";
        if (event.key !== backward && event.key !== forward) return;
        event.preventDefault();
        const id = element.getAttribute("aria-controls");
        const panel = id && context.panels.get(id);
        if (!panel || panel.disabled) return;
        const rtl = horizontal && getComputedStyle(element).direction === "rtl";
        const direction = (event.key === forward ? 1 : -1) * (rtl ? -1 : 1);
        if (direction > 0 && panel.handle.isCollapsed()) {
          panel.handle.expand();
          return;
        }
        const step = event.shiftKey ? largeKeyboardStep : keyboardStep;
        const { asPercentage, inPixels } = panel.handle.getSize();
        const target = inPixels + direction * step;
        // The separator's ARIA bounds include the constraints of the other panels.
        const min = Number(element.getAttribute("aria-valuemin"));
        const max = Number(element.getAttribute("aria-valuemax"));
        const panelSpace = inPixels / asPercentage;
        const next = panelSpace > 0 ? Math.max(min * panelSpace, Math.min(max * panelSpace, target)) : target;
        panel.handle.resize(Math.max(0, next));
      }}
      {...props}
    />
  );
}
