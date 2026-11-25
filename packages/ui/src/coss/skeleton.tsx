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
          ? "animate-skeleton motion-reduce:animate-none [--skeleton-highlight:--alpha(var(--color-white)/64%)] [background:linear-gradient(120deg,transparent_40%,var(--skeleton-highlight),transparent_60%)_var(--color-muted)_0_0/200%_100%_fixed] dark:[--skeleton-highlight:--alpha(var(--color-white)/4%)]"
          : "bg-muted",
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}
