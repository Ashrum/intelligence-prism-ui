"use client";

import { Badge as CossBadge, type BadgeProps as CossBadgeProps } from "@/components/coss/badge";
import { cn } from "@/lib/utils";

export interface BadgeProps extends Omit<CossBadgeProps, "variant"> {
  variant?: CossBadgeProps["variant"] | "info-solid" | "attention";
  /** Decorative Blueprint status mark. Keep a readable status in children. */
  mark?: "ok" | "warn" | "no";
}

/** Prism variants compose the pinned coss Badge with the Prism typography adapter; pinned upstream files stay untouched. */
export function Badge({ variant, mark, className, size = "lg", ...props }: BadgeProps) {
  const solidInfo = variant === "info-solid";
  return <CossBadge
    {...props}
    {...(mark ? { children: <><span data-slot="badge-mark" className="hidden" aria-hidden="true">{{ ok: "✓", warn: "!", no: "✗" }[mark]}</span>{props.children}</> } : {})}
    size={size}
    variant={solidInfo ? "info" : variant === "attention" ? "error" : variant}
    className={cn(solidInfo && "bg-info-foreground text-background dark:bg-info-foreground", className)}
  />;
}
