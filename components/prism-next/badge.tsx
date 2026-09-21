"use client";

import { Badge as CossBadge, type BadgeProps as CossBadgeProps } from "@/components/coss/badge";
import { cn } from "@/lib/utils";

export interface BadgeProps extends Omit<CossBadgeProps, "variant"> {
  variant?: CossBadgeProps["variant"] | "info-solid";
}

/** Prism variants compose the pinned coss Badge with the Prism typography adapter; pinned upstream files stay untouched. */
export function Badge({ variant, className, size = "lg", ...props }: BadgeProps) {
  const solidInfo = variant === "info-solid";
  return <CossBadge
    {...props}
    size={size}
    variant={solidInfo ? "info" : variant}
    className={cn(solidInfo && "bg-info-foreground text-background dark:bg-info-foreground", className)}
  />;
}
