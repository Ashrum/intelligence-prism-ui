"use client";

import { Check, Pencil, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { cn } from "../cn.js";
import { Button } from "../coss/button.js";
import { Input } from "../coss/input.js";

export interface EditableProps {
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  editLabel?: string;
  commitLabel?: string;
  cancelLabel?: string;
  emptyPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Editable({
  label, value: controlledValue, defaultValue = "", onValueChange, editLabel = "Edit",
  commitLabel = "Save", cancelLabel = "Cancel", emptyPlaceholder = "—", disabled, className,
}: EditableProps): ReactElement {
  const [value, setValue] = useState(defaultValue);
  const committed = controlledValue ?? value;
  const [draft, setDraft] = useState<string>();
  const editing = draft !== undefined && !disabled;
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [editing]);

  function finish(commit: boolean) {
    if (commit && draft !== undefined && draft !== committed) {
      if (controlledValue === undefined) setValue(draft);
      onValueChange?.(draft);
    }
    returnFocus.current = true;
    setDraft(undefined);
  }

  return (
    <div
      className={cn("flex min-w-0 items-center gap-1.5", className)}
      data-slot="editable"
      onKeyDown={(event) => {
        if (!editing || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === "Escape" || (event.key === "Enter" && event.target === inputRef.current)) {
          event.preventDefault();
          event.stopPropagation();
          finish(event.key === "Enter");
        }
      }}
    >
      {editing ? (
        <>
          <Input ref={inputRef} aria-label={label} value={draft} onChange={(event) => setDraft(event.target.value)} />
          <Button variant="ghost" size="icon" aria-label={commitLabel} onClick={() => finish(true)}>
            <Check aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={cancelLabel} onClick={() => finish(false)}>
            <X aria-hidden="true" />
          </Button>
        </>
      ) : (
        <Button
          ref={triggerRef}
          variant="outline"
          className="max-w-full justify-start"
          aria-label={`${editLabel} ${label} · ${committed || emptyPlaceholder}`}
          disabled={disabled}
          onClick={() => setDraft(committed)}
        >
          <span className="truncate">{committed || emptyPlaceholder}</span>
          <Pencil aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
