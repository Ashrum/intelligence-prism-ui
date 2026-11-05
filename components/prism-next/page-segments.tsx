"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { PageNavigationLink, type PageNavigationItem } from "./page-tabs";

export interface PageSegmentsProps extends Omit<ComponentProps<"nav">, "children"> {
  "aria-label": string;
  items: readonly PageNavigationItem[];
  currentId?: string;
}

export function PageSegments({ items, currentId, className, ...props }: PageSegmentsProps) {
  return <nav {...props} className={cn("bp-page-segments", className)}>
    {items.map(item => <PageNavigationLink key={item.id} item={item} current={item.id === currentId} variant="segment" />)}
  </nav>;
}
