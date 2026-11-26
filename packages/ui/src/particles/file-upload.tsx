"use client";

import { FilePlus, X } from "lucide-react";
import { useId, useRef, useState, type ReactElement } from "react";
import { cn } from "../cn.js";
import { Button } from "../coss/button.js";

export interface FileRejection {
  file: File;
  reason: "accept" | "size";
}

export function matchesFileAccept(file: Pick<File, "name" | "type">, accept = ""): boolean {
  const types = accept.toLowerCase().split(",").map((type) => type.trim()).filter(Boolean);
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  const match = (type: string) => {
    if (type.startsWith(".")) return name.endsWith(type);
    if (type.endsWith("/*")) return mime.startsWith(type.slice(0, -1));
    return mime === type;
  };
  return types.length === 0 || types.some(match);
}

export function filterSelectedFiles(files: readonly File[], accept?: string, maxSize = Infinity): {
  accepted: File[];
  rejected: FileRejection[];
} {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    if (!matchesFileAccept(file, accept)) rejected.push({ file, reason: "accept" });
    else if (file.size > maxSize) rejected.push({ file, reason: "size" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

function formatFileSize(size: number) {
  if (size >= 1048576) return `${+(size / 1048576).toFixed(2)} MiB`;
  if (size >= 1024) return `${+(size / 1024).toFixed(2)} KiB`;
  return `${size} B`;
}

export interface FileUploadProps {
  /** Native file picker filter, also applied to the local queue. */
  accept?: string;
  /** Maximum size of each file in bytes. */
  maxSize?: number;
  multiple?: boolean;
  value?: readonly File[];
  defaultValue?: readonly File[];
  onValueChange?: (files: File[]) => void;
  onReject?: (rejected: FileRejection[]) => void;
  label?: string;
  queueLabel?: string;
  hint?: string;
  removeLabel?: (file: File) => string;
  rejectionLabel?: (rejection: FileRejection) => string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  accept, maxSize, multiple = true, value: controlledValue, defaultValue = [], onValueChange, onReject,
  label = multiple ? "Choose files" : "Choose file", queueLabel = "Selected files", hint,
  removeLabel = (file) => `Remove ${file.name}`,
  rejectionLabel = ({ file, reason }) => `${file.name}: ${reason === "size" ? "File is too large" : "File type is not accepted"}`,
  disabled, className,
}: FileUploadProps): ReactElement {
  const [value, setValue] = useState(defaultValue);
  const [rejected, setRejected] = useState<FileRejection[]>([]);
  const current = controlledValue ?? value;
  const files = multiple ? current : current.slice(0, 1);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const hintId = useId();
  const fileHint = hint ?? [accept, maxSize === undefined ? undefined : `Up to ${formatFileSize(maxSize)} per file`].filter(Boolean).join(" · ");

  function update(next: File[]) {
    if (controlledValue === undefined) setValue(next);
    onValueChange?.(next);
  }

  return (
    <div className={cn("grid min-w-0 justify-items-start gap-2", className)} data-slot="file-upload">
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={label}
        hidden
        onChange={(event) => {
          const { accepted, rejected: invalid } = filterSelectedFiles(Array.from(event.currentTarget.files ?? []), accept, maxSize);
          event.currentTarget.value = "";
          setRejected(invalid);
          if (invalid.length) onReject?.(invalid);
          if (accepted.length) update(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
        }}
      />
      <Button ref={trigger} variant="outline" disabled={disabled} aria-describedby={fileHint ? hintId : undefined} onClick={() => input.current?.click()}>
        <FilePlus aria-hidden="true" /> {label}
      </Button>
      {fileHint && <p id={hintId} className="text-xs text-muted-foreground">{fileHint}</p>}
      {files.length > 0 && (
        <ul aria-label={queueLabel} role="list" className="grid w-full gap-1">
          {files.map((file, index) => (
            <li key={`${index}:${file.name}`} className="flex min-w-0 items-center gap-2 rounded-lg border bg-card px-2 py-1 text-sm text-card-foreground">
              <span className="min-w-0 flex-1 wrap-anywhere">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatFileSize(file.size)}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={removeLabel(file)}
                disabled={disabled}
                onClick={() => {
                  update(files.filter((_, position) => position !== index));
                  trigger.current?.focus();
                }}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div role="status" className="text-sm text-destructive-foreground empty:absolute">
        {rejected.map((entry, index) => <p key={`${index}:${entry.file.name}`} className="wrap-anywhere">{rejectionLabel(entry)}</p>)}
      </div>
    </div>
  );
}
