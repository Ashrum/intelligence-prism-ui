"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import styles from "./button.module.css"
import { buttonVariants } from "./button-variants"


type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Pass false from the idle render to reserve the asynchronous content. */
    loading?: boolean
    /** Missing, empty and whitespace-only values retain the original content. */
    loadingLabel?: string
  }

type SlottedContentProps = React.ComponentPropsWithoutRef<"button">

function Button({
  className, variant = "default", size = "default", asChild = false,
  loading, loadingLabel, disabled = false, children,
  onClick, onKeyDown, type, ...props
}: ButtonProps) {
  const child = asChild ? React.Children.only(children) : null
  if (asChild && !React.isValidElement<SlottedContentProps>(child)) {
    throw new TypeError("Button asChild requires one React element.")
  }
  const slotted = React.isValidElement<SlottedContentProps>(child) ? child : null
  const content = slotted ? slotted.props.children : children
  const busyLabel = loadingLabel?.trim() || undefined
  const isBusy = loading === true
  const asynchronous = loading !== undefined || busyLabel !== undefined
  const ariaDisabled = props["aria-disabled"] ?? slotted?.props["aria-disabled"]
  const isDisabled = disabled || slotted?.props.disabled === true
  const unavailable = isDisabled || isBusy || ariaDisabled === true || ariaDisabled === "true"
  const accessibleLabel = isBusy && busyLabel
    ? busyLabel
    : (props["aria-label"] ?? slotted?.props["aria-label"])

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (unavailable) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    slotted?.props.onClick?.(event)
    if (!event.defaultPrevented) onClick?.(event)
  }
  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (unavailable && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    slotted?.props.onKeyDown?.(event)
    if (!event.defaultPrevented) onKeyDown?.(event)
  }

  const body = asynchronous ? (
    <>
      <span className={styles.idle} aria-hidden={isBusy || undefined}>{content}</span>
      <span className={styles.busy} aria-hidden={!isBusy}>
        <span className={styles.spinner} aria-hidden="true" />
        <span className={styles.busyText}>{busyLabel ?? content}</span>
      </span>
    </>
  ) : content

  const shared = {
    ...props,
    "data-slot": "button",
    "data-variant": variant,
    "data-size": size,
    "data-loading": isBusy || undefined,
    "data-async": asynchronous || undefined,
    "aria-busy": isBusy || props["aria-busy"] || slotted?.props["aria-busy"] || undefined,
    "aria-disabled": unavailable || undefined,
    "aria-label": accessibleLabel,
    className: cn(buttonVariants({ variant, size }), className),
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  }

  if (slotted) {
    // Slot runs child handlers first. Move them into the guarded handlers above
    // so a busy/disabled link cannot invoke its original action or navigate.
    return (
      <Slot.Root {...shared}>
        {React.cloneElement(slotted, {
          onClick: undefined,
          onKeyDown: undefined,
          "aria-busy": shared["aria-busy"],
          "aria-disabled": shared["aria-disabled"],
          "aria-label": accessibleLabel,
          ...(isDisabled ? { tabIndex: -1 } : {}),
          ...(slotted.type === "button" ? { disabled: isDisabled, type: type ?? slotted.props.type ?? "button" } : {}),
        }, body)}
      </Slot.Root>
    )
  }

  return <button {...shared} type={type ?? "button"} disabled={isDisabled}>{body}</button>
}

export { Button }
export type { ButtonProps }
