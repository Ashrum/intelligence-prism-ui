import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "ui-meta", "ui-hint", "ui-action", "ui-body", "ui-title",
        "read-caption", "read-body", "read-lead", "read-title", "block-title",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
