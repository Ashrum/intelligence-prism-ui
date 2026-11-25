import type { ComponentProps } from "react";
import { cn } from "./cn.js";

const columns = ["01", "02", "03", "04", "05", "06", "07", "08"];
const rows = ["A", "B", "C", "D"];

export interface PrismRulerShellProps extends ComponentProps<"div"> {
  maxWidth?: number | string;
}

export function PrismRulerShell({
  maxWidth = 1280,
  className,
  style,
  children,
  ...props
}: PrismRulerShellProps) {
  return (
    <div
      {...props}
      className={cn("prism-ruler-shell", className)}
      style={{ maxWidth, ...style }}
    >
      <div className="prism-ruler-marks" aria-hidden="true">
        <div className="prism-ruler-top">
          {columns.map((mark) => <span key={mark}>{mark}</span>)}
        </div>
        <div className="prism-ruler-left">
          {rows.map((mark) => <span key={mark}>{mark}</span>)}
        </div>
      </div>
      {children}
    </div>
  );
}
