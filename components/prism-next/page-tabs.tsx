"use client";

import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useEffect, useImperativeHandle, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Menu, MenuTrigger, MenuGroup, MenuGroupLabel, MenuRadioGroup, MenuPrimitive, MenuSeparator } from "@/components/coss/menu";
import { MenuPopup } from "./scoped-overlays";
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
  subject?: {
    label: ReactNode; ariaLabel: string; onClick?: () => void;
    menu?: {
      groups: { label: string; items: { id: string; label: string; tag?: string; current?: boolean; muted?: boolean }[] }[];
      onSelect: (id: string) => void;
    };
  };
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

function SubjectMenu({ subject, children }: { subject: NonNullable<PageTabsProps["subject"]>; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const menu = subject.menu!;
  const current = menu.groups.flatMap(group => group.items).find(item => item.current)?.id;
  return <Menu open={open} onOpenChange={setOpen}>
    <MenuTrigger className="bp-page-tabs-subject text-block-title" aria-label={subject.ariaLabel}>{children}</MenuTrigger>
    <MenuPopup className="bp-page-tabs-subject-menu" align="start" sideOffset={6}>
      <MenuRadioGroup value={current ?? ""} onValueChange={id => { menu.onSelect(id); setOpen(false); }}>
        {menu.groups.map((group, index) => <MenuGroup key={group.label}>
          {index > 0 && <MenuSeparator />}
          <MenuGroupLabel className="bp-page-tabs-subject-group text-ui-meta">{group.label}</MenuGroupLabel>
          {group.items.map(item => <MenuPrimitive.RadioItem key={item.id} value={item.id} closeOnClick className="bp-page-tabs-subject-item text-ui-body" data-current={item.current || undefined}>
            <span className="bp-page-tabs-subject-mark" data-muted={item.muted || undefined} aria-hidden="true" />
            <span>{item.label}</span>
            {item.tag && <span className="bp-page-tabs-subject-tag text-ui-meta">{item.tag}</span>}
            {item.current && <Check className="bp-page-tabs-subject-check" size={16} aria-hidden="true" />}
          </MenuPrimitive.RadioItem>)}
        </MenuGroup>)}
      </MenuRadioGroup>
    </MenuPopup>
  </Menu>;
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
  const subjectContent = subject && <><span className="bp-page-tabs-subject-mark" aria-hidden="true" />{subject.label}<span className="bp-page-tabs-subject-switch"><ChevronsUpDown size={14} aria-hidden="true" /></span></>;
  const nav = <nav {...props} ref={navigation} data-stuck={sticky && stuck || undefined} className={cn("bp-page-tabs", subject && "bp-page-tabs--subject", sticky && "bp-page-tabs--sticky", className)}>
    {subject && (subject.menu ? <SubjectMenu subject={subject}>{subjectContent}</SubjectMenu> : subject.onClick ? <button type="button" className="bp-page-tabs-subject text-block-title" aria-label={subject.ariaLabel} onClick={subject.onClick}>{subjectContent}</button> : <span className="bp-page-tabs-subject text-block-title" aria-label={subject.ariaLabel}>{subjectContent}</span>)}
    {subject && items.length > 0 && <span className="bp-page-tabs-subject-divider" aria-hidden="true" />}
    {leading && <span className="bp-page-tabs-leading text-block-title">{leading}</span>}
    {items.map(item => <PageNavigationLink key={item.id} item={item} current={item.id === currentId} variant="tab" />)}
    {actions && <div className="bp-page-tabs-actions">{actions}</div>}
  </nav>;
  return sticky ? <><span ref={sentinel} className="bp-page-tabs-sentinel" aria-hidden="true" />{nav}</> : nav;
}
