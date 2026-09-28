"use client";

import { Button as CossButton, type ButtonProps as CossButtonProps } from "@/components/coss/button";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<CossButtonProps, "size" | "variant"> {
  size?: CossButtonProps["size"] | "navigation" | "navigation-icon";
  variant?: CossButtonProps["variant"] | "info";
}

/** Opt-in navigation targets and semantic info appearance; interactions stay with coss. */
export function Button({ size, variant, className, ...props }: ButtonProps) {
  const navigation = size === "navigation";
  const navigationIcon = size === "navigation-icon";
  const info = variant === "info";
  return <CossButton {...props}
    size={navigation || navigationIcon ? null : size}
    variant={info ? null : variant}
    className={cn(
      info && "border-info/30 bg-info/10 text-info-foreground hover:bg-info/20 focus-visible:ring-info *:data-[slot=button-loading-indicator]:text-info-foreground",
      navigation && "min-h-10 h-auto px-3 py-2 pointer-coarse:min-h-11",
      navigationIcon && "size-10 pointer-coarse:size-11",
      className,
    )}
  />;
}
