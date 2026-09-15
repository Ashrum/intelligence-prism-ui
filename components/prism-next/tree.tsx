"use client"

// Adapted from coss Origin tree.tsx (MIT); see vendor/coss-origin-tree.md.
import type { ItemInstance, TreeInstance } from "@headless-tree/core"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Tree<T>({ tree, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { tree: TreeInstance<T> }) {
  return <div {...tree.getContainerProps()} {...props} className={cn("flex min-w-0 flex-col", className)} data-slot="tree">{children}</div>
}

export function TreeItem<T>({ item, current = false, className, children, style, ...props }: HTMLAttributes<HTMLDivElement> & { item: ItemInstance<T>; current?: boolean; children: ReactNode }) {
  return <div {...item.getProps()} {...props} aria-expanded={item.isFolder() ? item.isExpanded() : undefined} aria-selected={current} data-slot="tree-item" data-current={current} style={{ "--tree-padding": `${item.getItemMeta().level * 20}px`, ...style } as CSSProperties} className={cn("group/tree-item min-w-0 rounded-lg ps-(--tree-padding) outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", className)}>{children}</div>
}

export function TreeItemLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} data-slot="tree-item-label" className={cn("flex min-h-9 min-w-0 items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent group-data-[current=true]/tree-item:bg-accent group-data-[current=true]/tree-item:font-medium sm:min-h-8", className)} />
}
