export type SegmentedControlSize = "sm" | "default" | "lg";

export const segmentedControlItemLayoutClassName =
  "gap-1.5 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export const segmentedControlItemSizeClassNames: Record<SegmentedControlSize, string> = {
  sm: "min-h-7 px-2 sm:min-h-6",
  default: "min-h-8 px-3 sm:min-h-7",
  lg: "min-h-9 px-3.5 sm:min-h-8",
};
