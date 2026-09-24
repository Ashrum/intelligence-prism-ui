"use client";

import type { ComponentProps } from "react";
import { Toolbar as CossToolbar, ToolbarPrimitive } from "@/components/coss/toolbar";
import { cn } from "@/lib/utils";

export { ToolbarButton, ToolbarLink, ToolbarInput, ToolbarGroup, ToolbarSeparator } from "@/components/coss/toolbar";

/** Use the same Base UI root without a frame when the surrounding layout owns it. */
export function Toolbar({ variant = "framed", className, ...props }: ComponentProps<typeof CossToolbar> & { variant?: "framed" | "plain" }) {
  if (variant === "framed") return <CossToolbar {...props} className={className} />;
  return <ToolbarPrimitive.Root className={cn("relative flex gap-2", className)} data-slot="toolbar" data-variant="plain" {...props} />;
}
