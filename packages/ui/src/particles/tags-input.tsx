"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { X } from "lucide-react";
import { useId, useMemo, useRef, useState, type ReactElement } from "react";
import { cn } from "../cn.js";
import { Button } from "../coss/button.js";

const defaultDelimiters = [","];
const emptyTags: readonly string[] = [];

/** Add trimmed, unique tags in input order, without truncating the current list. */
export function appendTags(current: readonly string[], candidates: readonly string[], maxTags = Infinity): string[] {
  const result = [...current];
  const seen = new Set(current);
  for (const candidate of candidates) {
    if (result.length >= maxTags) break;
    const tag = candidate.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

export interface TagsInputProps {
  label: string;
  id?: string;
  placeholder?: string;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /** Literal delimiters for typed or pasted text. Enter always commits the draft. */
  delimiters?: readonly string[];
  maxTags?: number;
  removeLabel?: (tag: string) => string;
  disabled?: boolean;
  className?: string;
}

export function TagsInput({
  label, id, placeholder, value: controlledValue, defaultValue = emptyTags, onValueChange,
  delimiters = defaultDelimiters, maxTags, removeLabel = (tag) => `Remove ${tag}`, disabled, className,
}: TagsInputProps): ReactElement {
  const [value, setValue] = useState(() => appendTags([], defaultValue, maxTags));
  const [draft, setDraft] = useState("");
  const current = controlledValue ?? value;
  const tags = useMemo(() => appendTags([], current), [current]);
  const input = useRef<HTMLInputElement>(null);
  const countId = useId();
  const separator = useMemo(() => {
    const tokens = delimiters.filter(Boolean).sort((a, b) => b.length - a.length);
    return tokens.length ? new RegExp(tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")) : undefined;
  }, [delimiters]);

  function update(next: string[]) {
    if (controlledValue === undefined) setValue(next);
    onValueChange?.(next);
  }

  function add(candidates: string[]) {
    const next = appendTags(tags, candidates, maxTags);
    if (next.length !== tags.length) update(next);
  }

  function parse(text: string) {
    const parts = separator ? text.split(separator) : [text];
    setDraft(parts.pop() ?? "");
    if (parts.length) add(parts);
  }

  return (
    <div className={cn("grid min-w-0 gap-1.5", className)} data-slot="tags-input">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background p-1.5 text-sm text-foreground focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
        {tags.length > 0 && (
          <ul aria-label={label} role="list" className="flex min-w-0 flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag} className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-secondary ps-2 text-secondary-foreground">
                <span className="min-w-0 wrap-anywhere">{tag}</span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={removeLabel(tag)}
                  disabled={disabled}
                  onClick={() => {
                    update(tags.filter((item) => item !== tag));
                    input.current?.focus();
                  }}
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <BaseInput
          ref={input}
          id={id}
          aria-label={label}
          aria-describedby={countId}
          className="min-h-6 min-w-24 flex-1 px-1 outline-none placeholder:text-muted-foreground"
          disabled={disabled}
          placeholder={placeholder}
          value={draft}
          onChange={(event) => {
            if ("isComposing" in event.nativeEvent && event.nativeEvent.isComposing) setDraft(event.target.value);
            else parse(event.target.value);
          }}
          onCompositionEnd={(event) => parse(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === "Enter") {
              event.preventDefault();
              add([draft]);
              setDraft("");
            } else if (event.key === "Backspace" && !draft && tags.length) {
              event.preventDefault();
              update(tags.slice(0, -1));
            }
          }}
        />
      </div>
      <output id={countId} className={cn("text-xs text-muted-foreground tabular-nums", maxTags === undefined && "sr-only")}>
        {maxTags === undefined ? tags.length : `${tags.length} / ${maxTags}`}
      </output>
    </div>
  );
}
