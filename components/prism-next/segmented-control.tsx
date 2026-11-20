"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group";
import "./segmented-control.css";

export interface SegmentedControlProps {
  items: readonly { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  size: "sm" | "md";
  lead?: ReactNode;
  "aria-label": string;
}

function selectWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  const { key, currentTarget, target } = event;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return;

  const items = Array.from(currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
  const index = items.findIndex(item => item === target);
  if (index === -1) return;

  const rtl = currentTarget.matches(":dir(rtl)");
  const forward = key === "ArrowDown" || key === (rtl ? "ArrowLeft" : "ArrowRight");
  const nextIndex = key === "Home" ? 0 : key === "End" ? items.length - 1
    : (index + (forward ? 1 : -1) + items.length) % items.length;

  event.preventDefault();
  event.stopPropagation();
  const next = items[nextIndex];
  next.focus();
  if (next.getAttribute("aria-checked") !== "true") next.click();
}

export function SegmentedControl({ items, value, onValueChange, size, lead, "aria-label": label }: SegmentedControlProps) {
  const tabStop = items.find(item => item.value === value) ?? items[0];
  return <div className="prism-segmented-control" data-size={size}>
    {lead != null && <div className="prism-segmented-control-lead">
      {lead}
      {items.length > 0 && <span className="prism-segmented-control-divider" aria-hidden="true" />}
    </div>}
    {items.length > 0 && <ToggleGroup className="prism-segmented-control-options" role="radiogroup" aria-label={label}
      multiple={false} value={[value]} onValueChange={([next]) => { if (next !== undefined) onValueChange(next); }}
      onKeyDownCapture={selectWithKeyboard}>
      {items.map(item => <ToggleGroupItem key={item.value} value={item.value} role="radio"
        aria-pressed={undefined} aria-checked={item.value === value} tabIndex={item === tabStop ? 0 : -1}>
        {item.label}
      </ToggleGroupItem>)}
    </ToggleGroup>}
  </div>;
}
