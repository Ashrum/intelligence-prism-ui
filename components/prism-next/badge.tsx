"use client";

import { Badge as CossBadge, type BadgeProps as CossBadgeProps } from "@/components/coss/badge";
import { cn } from "@/lib/utils";

export interface BadgeProps extends Omit<CossBadgeProps, "variant"> {
  variant?: CossBadgeProps["variant"] | "info-solid";
}

/** Prism variants compose the pinned coss Badge without changing its defaults. */
export function Badge({ variant, className, ...props }: BadgeProps) {
  const solidInfo = variant === "info-solid";
  return <CossBadge
    {...props}
    variant={solidInfo ? "info" : variant}
    className={cn(solidInfo && "bg-info-foreground text-background dark:bg-info-foreground", className)}
  />;
}
