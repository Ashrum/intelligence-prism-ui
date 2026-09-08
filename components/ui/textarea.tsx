import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-card px-3 py-2 text-base shadow-none transition-[color,box-shadow] outline-none placeholder:text-muted-foreground [&[readonly]]:border-[var(--border-default)] [&[readonly]]:bg-[var(--surface-quiet)] [&[readonly]]:focus-visible:ring-0 [&[readonly]]:focus-visible:border-[var(--field-border)] disabled:bg-[var(--surface-quiet)] disabled:border-[var(--border-subtle)] disabled:text-[var(--control-disabled-fg)] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-destructive md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
