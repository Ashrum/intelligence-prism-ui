"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { Check, ChevronDown, PanelLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/coss/avatar";
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuLinkItem } from "@/components/coss/menu";
import { Badge } from "@/components/prism-next/badge";
import { Button, type ButtonProps } from "@/components/prism-next/button";
import { cn } from "@/lib/utils";
import "./app-bar.css";

export interface PrismBrandMarkProps extends ComponentProps<"span"> {
  /** Height of the tallest bar in CSS pixels; the original shell mark is 20. */
  size?: number;
}

/** Decorative brand asset, never a task state or accessible name. */
export function PrismBrandMark({ size, className, style, ...props }: PrismBrandMarkProps) {
  return <span {...props} aria-hidden="true" className={cn("prism-brand-mark", className)}
    style={{ ...style, ...(size === undefined ? {} : { "--prism-brand-mark-size": `${size}px` }) } as CSSProperties}>
    <span /><span /><span />
  </span>;
}

export interface InstitutionWordmarkProps extends Omit<ComponentProps<"span">, "children"> {
  children: string;
  maxWidth?: CSSProperties["maxWidth"];
}

/** D1: this institution asset is the sole consumer of the brand typography role. */
export function InstitutionWordmark({ children, maxWidth = 208, className, style, ...props }: InstitutionWordmarkProps) {
  return <span title={children} {...props} className={cn("prism-institution-wordmark text-brand-wordmark", className)}
    style={{ maxWidth, ...style }}>{children}</span>;
}

export interface AppBarProps extends Omit<ComponentProps<"header">, "children"> {
  identity: ReactNode;
  navigation: ReactNode;
  tools?: ReactNode;
}

/** Its own available inline size, rather than the viewport, chooses navigation density. */
export function AppBar({ identity, navigation, tools, className, ...props }: AppBarProps) {
  return <header {...props} className={cn("prism-app-bar-root", className)}>
    <div className="prism-app-bar">
      <div className="prism-app-bar-identity-slot">{identity}</div>
      <div className="prism-app-bar-navigation-slot">{navigation}</div>
      <div className="prism-app-bar-tools">{tools}</div>
    </div>
  </header>;
}

export interface AppBarIdentityProps extends Omit<ButtonProps, "children" | "size" | "variant"> {
  institution: string;
  href: string;
  showWordmark?: boolean;
}

export function AppBarIdentity({ institution, href, showWordmark = true, render, className, ...props }: AppBarIdentityProps) {
  return <Button aria-label={`${institution} · 回到 Agent`} title={institution} {...props}
    render={render ?? <a href={href} />} size={null} variant="ghost"
    data-wordmark={showWordmark} className={cn("prism-app-bar-identity", className)}>
    <PrismBrandMark />
    {showWordmark && <InstitutionWordmark>{institution}</InstitutionWordmark>}
  </Button>;
}

export interface AppBarNavigationProps extends ComponentProps<"nav"> {
  /** The same host-owned spaces rendered as AppBarSpaceMenu for widths below 600. */
  compact: ReactNode;
}

export function AppBarNavigation({ compact, children, className, ...props }: AppBarNavigationProps) {
  return <>
    <nav aria-label="一级导航" {...props} className={cn("prism-app-bar-navigation", className)}>{children}</nav>
    <div className="prism-app-bar-compact-navigation">{compact}</div>
  </>;
}

export interface AppBarNavLinkProps extends Omit<ButtonProps, "size" | "variant"> {
  href: string;
  icon?: ReactNode;
  hideIcon?: boolean;
}

export function AppBarNavLink({ href, icon, hideIcon = false, children, render, className, ...props }: AppBarNavLinkProps) {
  return <Button {...props} render={render ?? <a href={href} />} size={null} variant="ghost"
    className={cn("prism-app-bar-nav-link text-ui-action", className)}>
    <span className="prism-app-bar-nav-content">
      {icon && !hideIcon && <span className="prism-app-bar-nav-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  </Button>;
}

export interface AppBarSpace {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  /** Optional host router link. No router is imported by Prism. */
  render?: ComponentProps<typeof MenuLinkItem>["render"];
}

export interface AppBarSpaceMenuProps {
  items: readonly AppBarSpace[];
  currentId?: string | null;
  onSelect?: (id: string) => void;
  placeholder?: string;
  menuProps?: ComponentProps<typeof Menu>;
  popupProps?: ComponentProps<typeof MenuPopup>;
}

export function AppBarSpaceMenu({ items, currentId, onSelect, placeholder = "切换空间", menuProps, popupProps }: AppBarSpaceMenuProps) {
  const current = items.find(item => item.id === currentId);
  return <Menu {...menuProps}>
    <MenuTrigger render={<Button variant="secondary" size={null} className="prism-app-bar-space-trigger" />}
      aria-label={current ? `当前空间 ${current.label}，切换空间` : placeholder}>
      {current?.icon && <span aria-hidden="true" className="prism-app-bar-menu-icon">{current.icon}</span>}
      <span className="prism-app-bar-menu-text">{current?.label ?? placeholder}</span>
      <ChevronDown aria-hidden="true" className="size-3.5" />
    </MenuTrigger>
    <MenuPopup align="start" aria-label="切换空间" {...popupProps}
      className={cn("prism-app-bar-space-popup", popupProps?.className)}>
      {items.map(item => {
        const content = <>
          {item.icon && <span aria-hidden="true" className="prism-app-bar-menu-icon">{item.icon}</span>}
          <span className="prism-app-bar-menu-text">{item.label}</span>
          {item.id === currentId && <Check aria-hidden="true" className="size-4" />}
        </>;
        const props = { "aria-current": item.id === currentId ? "page" as const : undefined,
          className: "prism-app-bar-space-item", onClick: () => onSelect?.(item.id) };
        return item.href !== undefined || item.render
          ? <MenuLinkItem key={item.id} {...props} href={item.href} render={item.render}>{content}</MenuLinkItem>
          : <MenuItem key={item.id} {...props}>{content}</MenuItem>;
      })}
    </MenuPopup>
  </Menu>;
}

export interface AppBarToolGroupProps extends ComponentProps<"div"> {
  /** desktop >=600; wide >=900; compact <900; phone <600. Must be inside AppBar. */
  visibility?: "always" | "desktop" | "wide" | "compact" | "phone";
}

export function AppBarToolGroup({ visibility = "always", className, ...props }: AppBarToolGroupProps) {
  return <div {...props} data-app-bar-visibility={visibility} className={cn("prism-app-bar-tool-group", className)} />;
}

function knownCount(count: number | null | undefined): count is number {
  return typeof count === "number" && Number.isSafeInteger(count) && count >= 0;
}

export function IconCountBadge({ count }: { count?: number | null }) {
  if (!knownCount(count)) return null;
  return <Badge size="sm" className="prism-icon-count-badge text-component-label" aria-hidden="true">{count}</Badge>;
}

export interface BarIconButtonProps extends Omit<ButtonProps, "size" | "variant" | "aria-label"> {
  label: string;
  count?: number | null;
  countUnit?: string;
  size?: "global" | "space";
}

export function BarIconButton({ label, count, countUnit = "", size = "global", children, className, ...props }: BarIconButtonProps) {
  return <Button {...props} variant="ghost" size={null} data-bar-size={size}
    aria-label={knownCount(count) ? `${label}，${count}${countUnit}` : label}
    className={cn("prism-bar-icon-button", className)}>
    <span aria-hidden="true" className="prism-bar-button-icon">{children}</span>
    <IconCountBadge count={count} />
  </Button>;
}

/** The label and environment explanation are supplied by the host. */
export function AppBarStatusButton({ className, children, ...props }: Omit<ButtonProps, "size" | "variant">) {
  return <Button {...props} size={null} variant="secondary" className={cn("prism-app-bar-status text-component-label", className)}>
    <span className="prism-app-bar-status-dot" aria-hidden="true" />{children}
  </Button>;
}

export interface AppBarPersonalMenuProps {
  identity: { name: string; institution: string; detail: string; initials: string };
  children: ReactNode;
  menuProps?: ComponentProps<typeof Menu>;
  popupProps?: ComponentProps<typeof MenuPopup>;
}

export function AppBarPersonalMenu({ identity, children, menuProps, popupProps }: AppBarPersonalMenuProps) {
  const avatar = (large = false) => <Avatar className={cn("prism-app-bar-avatar", large && "prism-app-bar-avatar-large")} aria-hidden="true">
    <AvatarFallback>{identity.initials}</AvatarFallback>
  </Avatar>;
  return <Menu {...menuProps}>
    <MenuTrigger aria-label={`${identity.name}的个人菜单`}
      render={<Button variant="ghost" size={null} className="prism-app-bar-personal-trigger" />}>
      {avatar()}
    </MenuTrigger>
    <MenuPopup align="end" aria-label={`${identity.name}的个人菜单`} {...popupProps}
      className={cn("prism-app-bar-personal-popup", popupProps?.className)}>
      <div className="prism-app-bar-personal-identity">
        {avatar(true)}
        <div className="prism-app-bar-personal-copy">
          <p className="text-item-title">{identity.name}</p>
          <div className="prism-app-bar-personal-institution"><PrismBrandMark size={14} /><InstitutionWordmark>{identity.institution}</InstitutionWordmark></div>
          <p className="text-ui-meta text-muted-foreground">{identity.detail}</p>
        </div>
      </div>
      {children}
    </MenuPopup>
  </Menu>;
}

export interface SpaceBarProps extends ComponentProps<"div"> {
  side?: { title: string; collapsed: boolean; onToggle: () => void; controls?: string };
  sideWidth?: CSSProperties["width"];
  tools?: ReactNode;
}

/** Side visibility is a host layout fact; this component only emits a toggle intent. */
export function SpaceBar({ side, sideWidth = 248, tools, children, className, ...props }: SpaceBarProps) {
  return <div {...props} className={cn("prism-space-bar-root", className)}>
    <div className="prism-space-bar" role="group" aria-label="空间工具" data-side={side ? (side.collapsed ? "collapsed" : "expanded") : "none"}>
      {side && <div className="prism-space-bar-side" style={side.collapsed ? undefined : { width: sideWidth }}>
        {!side.collapsed && <span className="text-item-title prism-space-bar-side-title">{side.title}</span>}
        <BarIconButton size="space" label={`${side.collapsed ? "打开" : "收起"}${side.title}`}
          aria-expanded={!side.collapsed} aria-controls={side.controls} onClick={side.onToggle}>
          <PanelLeft />
        </BarIconButton>
      </div>}
      <div className="prism-space-bar-content">{children}</div>
      {tools && <div className="prism-space-bar-tools">{tools}</div>}
    </div>
  </div>;
}

export function SpaceBarTitle({ className, ...props }: ComponentProps<"span">) {
  return <span {...props} className={cn("prism-space-bar-title text-item-title", className)} />;
}

export interface PageHeadProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHead({ title, description, actions, className, ...props }: PageHeadProps) {
  return <div {...props} className={cn("prism-page-head-root", className)}>
    <div className="prism-page-head">
      <div className="prism-page-head-copy">
        <h1 className="text-section-title">{title}</h1>
        {description && <p className="text-ui-hint text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="prism-page-head-actions">{actions}</div>}
    </div>
  </div>;
}
