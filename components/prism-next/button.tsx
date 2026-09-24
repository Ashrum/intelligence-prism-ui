"use client";

import { Button as CossButton, type ButtonProps as CossButtonProps } from "@/components/coss/button";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<CossButtonProps, "size"> {
  size?: CossButtonProps["size"] | "navigation" | "navigation-icon";
}

/** Opt-in navigation targets; all appearance and interaction stay with coss. */
export function Button({ size, className, ...props }: ButtonProps) {
  const navigation = size === "navigation";
  const navigationIcon = size === "navigation-icon";
  return <CossButton {...props}
    size={navigation || navigationIcon ? null : size}
    className={cn(
      navigation && "min-h-10 h-auto px-3 py-2 pointer-coarse:min-h-11",
      navigationIcon && "size-10 pointer-coarse:size-11",
      className,
    )}
  />;
}
