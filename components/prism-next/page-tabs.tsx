"use client";

import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./page-navigation.css";

export interface PageNavigationItem extends Omit<useRender.ComponentProps<"a">, "children" | "id"> {
  id: string;
  label: ReactNode;
  count?: number;
  tone?: "todo";
}

export interface PageTabsProps extends Omit<ComponentProps<"nav">, "children"> {
  "aria-label": string;
  items: readonly PageNavigationItem[];
  currentId?: string;
  leading?: ReactNode;
  actions?: ReactNode;
}

/** Native links retain Tab navigation; routing and selection belong to the host. */
export function PageNavigationLink({ item, current, variant }: {
  item: PageNavigationItem; current: boolean; variant: "tab" | "segment";
}) {
  const { id: _id, label, count, tone, render, className, ...props } = item;
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(props, {
      className: cn(`bp-page-${variant}`, variant === "tab" ? "text-block-title" : "text-ui-body", className),
      "aria-current": current ? "page" : undefined,
      children: <>{label}{count !== undefined && <span className="bp-nav-count text-ui-meta" data-tone={tone} aria-label={tone === "todo" ? `${count} 项待处理` : undefined}>{count.toLocaleString("en-US")}</span>}</>,
    }),
  });
}

export function PageTabs({ items, currentId, leading, actions, className, ...props }: PageTabsProps) {
  return <nav {...props} className={cn("bp-page-tabs", className)}>
    {leading && <span className="bp-page-tabs-leading text-block-title">{leading}</span>}
    {items.map(item => <PageNavigationLink key={item.id} item={item} current={item.id === currentId} variant="tab" />)}
    {actions && <div className="bp-page-tabs-actions">{actions}</div>}
  </nav>;
}
