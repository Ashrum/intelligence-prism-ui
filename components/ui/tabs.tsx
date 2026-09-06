"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { useSelectionIndicator } from "@/components/ui/use-selection-indicator"
import { cn } from "@/lib/utils"

function Tabs({ className, orientation = "horizontal", ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" data-orientation={orientation} orientation={orientation} className={cn("prism-tabs", className)} {...props} />
}

const tabsListVariants = cva("prism-tabs-list", {
  variants: { variant: { default: "prism-tabs-list--surface", line: "prism-tabs-list--page" } },
  defaultVariants: { variant: "default" },
})

function TabsList({ className, variant = "default", children, ref, asChild, ...props }: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => trackRef.current as HTMLDivElement)
  useSelectionIndicator(trackRef, '[data-slot="tabs-trigger"][data-state="active"]')
  const indicator = <span aria-hidden="true" className="selection-indicator" data-selection-indicator />
  const content = asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
    ? React.cloneElement(children, {}, indicator, children.props.children)
    : <>{indicator}{children}</>
  return (
    <div className="selection-scroll" data-selection-scroll>
      <TabsPrimitive.List {...props} ref={trackRef} asChild={asChild} data-slot="tabs-list" data-variant={variant} className={cn(tabsListVariants({ variant }), className)}>
        {content}
      </TabsPrimitive.List>
    </div>
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger data-slot="tabs-trigger" data-selection-option className={cn("prism-tabs-trigger", className)} {...props} />
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("min-w-0 flex-1 outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
