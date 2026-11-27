import type React from "react";
import { cn } from "../cn.js";

export function Skeleton({
  animated = true,
  className,
  ...props
}: React.ComponentProps<"div"> & { animated?: boolean }): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-sm",
        animated
          ? "animate-skeleton motion-reduce:animate-none [background:linear-gradient(120deg,transparent_40%,var(--ole-surface-hover),transparent_60%)_var(--ole-surface-layer-2)_0_0/200%_100%_fixed]"
          : "bg-muted",
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}
