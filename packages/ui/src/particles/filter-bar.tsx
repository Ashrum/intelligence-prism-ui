"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "../cn.js";
import { Button, buttonVariants } from "../coss/button.js";
import { Group, GroupSeparator, GroupText } from "../coss/group.js";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "../coss/popover.js";

export function FilterBar({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("min-w-0 rounded-md border border-border bg-card text-card-foreground", className)} {...props} />;
}

export function FilterBarHeader({ expanded, className, ...props }: ComponentProps<"div"> & { expanded: boolean }) {
  return <div className={cn("flex min-w-0 items-center gap-2 px-3", expanded ? "min-h-9 border-b border-border" : "min-h-[34px]", className)} {...props} />;
}

export function FilterBarChips({ className, ...props }: ComponentProps<"div">) {
  return <div role="group" className={cn("flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none]", className)} {...props} />;
}

export function FilterChipRemove({ className, ...props }: ComponentProps<typeof Button> & { "aria-label": string }) {
  return (
    <Button type="button" size="icon-xs" variant="outline" className={cn("border-border dark:bg-popover dark:hover:bg-accent motion-reduce:transition-none", className)} {...props}>
      <X aria-hidden="true" />
    </Button>
  );
}

export function FilterChipShell({ children, label, removeLabel, onRemove, className, ...props }: Omit<ComponentProps<typeof Group>, "children"> & {
  children?: ReactNode;
  label: string;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <Group className={cn("shrink-0", className)} {...props}>
      <GroupText
        className={cn(buttonVariants({ size: "xs", variant: "outline" }),
          "pointer-events-none max-w-48 border-border text-muted-foreground dark:bg-popover motion-reduce:transition-none")}
        title={label}
      >
        <span className="truncate">{label}</span>
      </GroupText>
      <GroupSeparator className="bg-border" />
      {children}
      {children != null && <GroupSeparator className="bg-border" />}
      <FilterChipRemove aria-label={removeLabel} onClick={onRemove} />
    </Group>
  );
}

export type FilterChipOption = { id: string; label: string; count?: number };

export function FilterChipOptions({ options, value, valueLabel, triggerLabel, optionsLabel, onValueChange }: {
  options: readonly FilterChipOption[];
  value: string;
  valueLabel: string;
  triggerLabel: string;
  optionsLabel: string;
  onValueChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);
  const choices = selected ? options : [{ id: value, label: valueLabel }, ...options];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button size="xs" variant="outline" className="max-w-48 border-border dark:bg-popover dark:hover:bg-accent motion-reduce:transition-none" />}
        aria-label={triggerLabel}
      >
        <span className="truncate">{selected?.label ?? valueLabel}</span>
        <ChevronDown aria-hidden="true" />
      </PopoverTrigger>
      <PopoverPopup align="start" className="min-w-36 max-w-(--available-width) border-border motion-reduce:transition-none [&>[data-slot=popover-viewport]]:p-1">
        <PopoverTitle className="sr-only">{optionsLabel}</PopoverTitle>
        <div className="grid gap-0.5">
          {choices.map((option) => {
            const active = option.id === value;
            return (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant="ghost"
                className="w-full justify-start whitespace-normal text-start aria-pressed:bg-accent aria-pressed:text-accent-foreground motion-reduce:transition-none"
                aria-pressed={active}
                disabled={option.count === 0 && !active}
                onClick={() => {
                  setOpen(false);
                  if (!active) onValueChange(option.id);
                }}
              >
                <Check aria-hidden="true" className={cn("size-3.5", !active && "invisible")} />
                <span className="min-w-0 wrap-anywhere">{option.label}</span>
                {option.count !== undefined && <span className="ms-auto text-muted-foreground tabular-nums">{option.count}</span>}
              </Button>
            );
          })}
        </div>
      </PopoverPopup>
    </Popover>
  );
}

type FilterBarAction = ComponentProps<typeof Button>;

export function FilterBarActions({ children, className, reset, toggle, ...props }: ComponentProps<"div"> & {
  reset?: FilterBarAction;
  toggle?: FilterBarAction;
}) {
  return (
    <div className={cn("ms-auto flex shrink-0 items-center gap-0.5", className)} {...props}>
      {children}
      {reset && <Button type="button" size="xs" variant="ghost" {...reset} />}
      {toggle && <Button type="button" size="xs" variant="ghost" {...toggle} />}
    </div>
  );
}

export function FilterBarBody({ expanded, ...props }: Omit<ComponentProps<"div">, "hidden"> & { expanded: boolean }) {
  return <div {...props} hidden={!expanded} />;
}
