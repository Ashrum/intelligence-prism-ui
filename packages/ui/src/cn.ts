import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-score-display", "text-metric-display", "text-page-title", "text-section-title",
        "text-block-title", "text-item-title", "text-read-body", "text-read-lead",
        "text-read-title", "text-read-caption", "text-ui-body", "text-ui-action",
        "text-ui-hint", "text-ui-meta", "text-ui-title", "text-component-label",
        "text-stat-display", "text-brand-wordmark",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
