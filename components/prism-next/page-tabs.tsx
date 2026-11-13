"use client";

import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useEffect, useImperativeHandle, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ArrowRightLeft } from "lucide-react";
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
  subject?: { label: ReactNode; ariaLabel: string; onClick?: () => void };
  sticky?: boolean;
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

export function PageTabs({ items, currentId, leading, actions, subject, sticky = false, className, ...props }: PageTabsProps) {
  const sentinel = useRef<HTMLSpanElement>(null);
  const navigation = useRef<HTMLElement>(null);
  useImperativeHandle(props.ref, () => navigation.current!);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    setStuck(false);
    if (!sticky || !sentinel.current || !navigation.current || typeof IntersectionObserver === "undefined") return;
    const top = Number.parseFloat(getComputedStyle(navigation.current).top) || 0;
    let scrollRoot = navigation.current.parentElement;
    while (scrollRoot && !/(auto|scroll|hidden|overlay)/.test(getComputedStyle(scrollRoot).overflowY)) {
      scrollRoot = scrollRoot.parentElement;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setStuck(!entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? top));
    }, { root: scrollRoot, rootMargin: `${-top}px 0px 0px 0px`, threshold: 0 });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [sticky]);
  const subjectContent = subject && <>{subject.label}<ArrowRightLeft size={16} aria-hidden="true" /></>;
  const nav = <nav {...props} ref={navigation} data-stuck={sticky && stuck || undefined} className={cn("bp-page-tabs", subject && "bp-page-tabs--subject", sticky && "bp-page-tabs--sticky", className)}>
    {subject && (subject.onClick ? <button type="button" className="bp-page-tabs-subject text-block-title" aria-label={subject.ariaLabel} onClick={subject.onClick}>{subjectContent}</button> : <span className="bp-page-tabs-subject text-block-title" aria-label={subject.ariaLabel}>{subjectContent}</span>)}
    {leading && <span className="bp-page-tabs-leading text-block-title">{leading}</span>}
    {items.map(item => <PageNavigationLink key={item.id} item={item} current={item.id === currentId} variant="tab" />)}
    {actions && <div className="bp-page-tabs-actions">{actions}</div>}
  </nav>;
  return sticky ? <><span ref={sentinel} className="bp-page-tabs-sentinel" aria-hidden="true" />{nav}</> : nav;
}
