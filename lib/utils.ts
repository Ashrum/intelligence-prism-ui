import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { typographyFontSizeClasses } from "./prism-next/typography";

// Semantic font sizes must not be merged as text colours (including coss defaults).
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": typographyFontSizeClasses } },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
