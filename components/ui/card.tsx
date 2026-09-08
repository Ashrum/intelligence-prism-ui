import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex min-w-0 flex-col gap-6 rounded-lg border bg-card py-6 text-card-foreground",
        className
      )}
      {...props}
    />
  )
}

function ObjectCard({
  className,
  selected,
  tone = "knowledge",
  ...props
}: React.ComponentProps<"article"> & {
  selected?: boolean
  tone?: "knowledge" | "ai"
}) {
  return (
    <article
      data-slot="object-card"
      data-selected={selected || undefined}
      data-tone={tone}
      className={cn("object-card", className)}
      {...props}
    />
  )
}

function ObjectCardHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="object-card-header" className={cn("object-card-header", className)} {...props} />
}

function ObjectCardIdentity({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="object-card-identity" className={cn("object-card-identity", className)} {...props} />
}

function ObjectCardMeta({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="object-card-meta" className={cn("object-card-meta", className)} {...props} />
}

function ObjectCardStatus({
  className,
  state = "help",
  ...props
}: React.ComponentProps<"div"> & {
  state?: "help" | "loading" | "error" | "success"
}) {
  return (
    <div
      data-slot="object-card-status"
      data-state={state}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("object-card-status", className)}
      {...props}
    />
  )
}

function ObjectCardActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="object-card-actions" className={cn("object-card-actions", className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  ObjectCard,
  ObjectCardHeader,
  ObjectCardIdentity,
  ObjectCardMeta,
  ObjectCardStatus,
  ObjectCardActions,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
