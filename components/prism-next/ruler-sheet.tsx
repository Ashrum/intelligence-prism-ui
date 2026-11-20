import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import "./ruler-sheet.css";

const rulerMarks = ["01", "02", "03", "04", "05", "06", "07", "08"];

export interface RulerSheetProps extends ComponentPropsWithoutRef<"div"> {
  maxWidth?: number | string;
}

export function RulerSheet({ maxWidth = 1280, className, style, children, ...props }: RulerSheetProps) {
  return <div {...props} className={cn("prism-ruler-sheet", className)} style={{ maxWidth, ...style }}>
    <div className="prism-ruler-sheet-top" aria-hidden="true">
      {rulerMarks.map(mark => <span key={mark}>{mark}</span>)}
    </div>
    {children}
  </div>;
}

export function RulerSheetBand({ className, ...props }: ComponentPropsWithoutRef<"header">) {
  return <header {...props} className={cn("prism-ruler-sheet-band", className)} />;
}
