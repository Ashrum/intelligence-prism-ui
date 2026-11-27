"use client";

import { ShoppingBasketIcon } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { useDrawerChannel, type DrawerChannelView } from "./drawer-channel.js";
import { LayoutList, type LayoutListProps } from "./templates.js";

export interface BasketTriggerProps extends Omit<ComponentProps<"button">, "children" | "type"> {
  count: number;
  label?: string;
}

export function BasketTrigger({ count, label = "试卷篮", ...props }: BasketTriggerProps) {
  return (
    <button type="button" data-slot="workbench-action" {...props}
      aria-label={props["aria-label"] ?? `${label}（${count}）`} aria-haspopup="dialog">
      <ShoppingBasketIcon aria-hidden="true" size={16} />
      <span>{label}</span>
      <span data-slot="workbench-basket-count" aria-hidden="true">{count}</span>
    </button>
  );
}

export interface BasketDrawerOptions extends Partial<Pick<DrawerChannelView, "mode" | "readLeave" | "allowBackdropExit">> {
  id?: string;
  title?: string;
  size?: DrawerChannelView["size"];
}

/** Control the basket through the same DrawerChannelHost that renders navigation and details. */
export function useBasketDrawer({
  id = "workbench-basket", title = "试卷篮", mode = "readonly", size = "md", readLeave, allowBackdropExit,
}: BasketDrawerOptions = {}) {
  const channel = useDrawerChannel();
  const isView = (view: DrawerChannelView) => view.id === id;
  const open = channel.state.views.some(isView);
  function onOpenChange(next: boolean) {
    if (next && !open) {
      channel.openRoot({ id, host: id, title, mode, size, kind: "business", readLeave, allowBackdropExit });
    } else if (!next && channel.state.views.at(-1)?.id === id) {
      channel.requestExit("system");
    }
  }
  return { open, onOpenChange, isView };
}

export interface FilterSummaryListProps extends Omit<LayoutListProps, "summary"> {
  summary?: ReactNode;
  summaryLabel?: string;
  summaryOpen?: boolean;
  defaultSummaryOpen?: boolean;
  onSummaryOpenChange?: (open: boolean) => void;
}

export function FilterSummaryList({
  summary, summaryLabel = "摘要", summaryOpen, defaultSummaryOpen = true, onSummaryOpenChange, ...props
}: FilterSummaryListProps) {
  const [expanded, setExpanded] = useState(defaultSummaryOpen);
  const open = summaryOpen ?? expanded;
  return (
    <LayoutList {...props} summary={summary == null ? undefined : (
      <details data-slot="workbench-filter-summary" open={open}
        onToggle={(event) => {
          const next = event.currentTarget.open;
          if (next === open) return;
          if (summaryOpen === undefined) setExpanded(next);
          else event.currentTarget.open = open;
          onSummaryOpenChange?.(next);
        }}>
        <summary>{summaryLabel}</summary>
        {summary}
      </details>
    )} />
  );
}

export { LayoutFocus as PaperStage } from "./templates.js";

export interface InspectorSlotProps {
  label?: string;
  controls?: ReactNode;
  children: ReactNode;
}

/** Reuse the same inspector/agent content in the AppShell auxiliary slot and the Drawer channel. */
export function InspectorSlot({ label = "辅助内容", controls, children }: InspectorSlotProps) {
  return (
    <section data-slot="workbench-inspector-slot" aria-label={label}>
      {controls != null && <div data-slot="workbench-inspector-controls">{controls}</div>}
      {children}
    </section>
  );
}
