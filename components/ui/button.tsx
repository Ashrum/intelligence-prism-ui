import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva("ui-button", {
  variants: {
    variant: {
      default: "ui-button--primary",
      destructive: "ui-button--destructive",
      outline: "ui-button--outline",
      secondary: "ui-button--secondary",
      ghost: "ui-button--ghost",
      "ai-soft": "ui-button--ai-soft",
      "ai-primary": "ui-button--ai-primary",
      link: "ui-button--link",
    },
    size: {
      default: "ui-button--size-default",
      compact: "ui-button--size-compact",
      xs: "ui-button--size-xs",
      sm: "ui-button--size-sm",
      lg: "ui-button--size-lg",
      icon: "ui-button--size-icon",
      "icon-xs": "ui-button--size-icon-xs",
      "icon-sm": "ui-button--size-icon-sm",
      "icon-lg": "ui-button--size-icon-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    loadingLabel?: React.ReactNode
  }

type SlottedChildProps = {
  children?: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
  "aria-disabled"?: React.AriaAttributes["aria-disabled"]
}

function hasUsableLoadingLabel(label: React.ReactNode) {
  if (typeof label === "string") return label.trim().length > 0
  return label !== undefined && label !== null && label !== false && label !== true
}

function preventActivation(event: React.SyntheticEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function Button(inputProps: ButtonProps) {
  const hasLoadingState =
    Object.prototype.hasOwnProperty.call(inputProps, "loading") ||
    Object.prototype.hasOwnProperty.call(inputProps, "loadingLabel")
  const {
    asChild = false,
    children,
    className,
    disabled = false,
    loading = false,
    loadingLabel,
    onClick,
    onKeyDown,
    ref,
    size = "default",
    type,
    variant = "default",
    "aria-disabled": ariaDisabled,
    ...props
  } = inputProps
  const blocked = disabled || loading
  const resolvedAriaDisabled = blocked ? true : ariaDisabled

  function renderContent(content: React.ReactNode) {
    const hasBusyLabel = hasUsableLoadingLabel(loadingLabel)

    if (!hasBusyLabel) {
      return (
        <span className="ui-button__content" data-slot="button-content">
          {hasLoadingState && (
            <span
              className="ui-button__spinner ui-button__spinner--reserved"
              data-slot="button-spinner"
              data-visible={loading || undefined}
              aria-hidden="true"
            />
          )}
          {content}
        </span>
      )
    }

    return (
      <>
        <span
          className="ui-button__content"
          data-slot="button-content"
          aria-hidden={loading || undefined}
        >
          {content}
        </span>
        <span
          className="ui-button__loading"
          data-slot="button-loading"
          aria-hidden={!loading}
        >
          <span className="ui-button__spinner" data-slot="button-spinner" aria-hidden="true" />
          {loadingLabel}
        </span>
      </>
    )
  }

  const sharedProps = {
    ...props,
    "aria-busy": loading || undefined,
    "aria-disabled": resolvedAriaDisabled,
    "data-disabled": disabled || undefined,
    "data-loading": loading || undefined,
    "data-size": size,
    "data-slot": "button",
    "data-variant": variant,
    className: cn(buttonVariants({ variant, size, className })),
  }

  if (asChild) {
    const child = React.isValidElement<SlottedChildProps>(children)
      ? children
      : null
    const guardedChild = child
      ? React.cloneElement(child, {
          "aria-disabled": resolvedAriaDisabled,
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            if (blocked) {
              preventActivation(event)
              return
            }
            child.props.onClick?.(event)
            onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>)
          },
          onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            if (blocked && (event.key === "Enter" || event.key === " ")) {
              preventActivation(event)
              return
            }
            child.props.onKeyDown?.(event)
            onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
          },
        })
      : children

    return (
      <Slot.Root {...sharedProps} ref={ref as React.Ref<HTMLElement>}>
        <Slot.Slottable child={guardedChild}>
          {(content) => renderContent(content)}
        </Slot.Slottable>
      </Slot.Root>
    )
  }

  return (
    <button
      {...sharedProps}
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={(event) => {
        if (blocked) {
          preventActivation(event)
          return
        }
        onClick?.(event)
      }}
      onKeyDown={(event) => {
        if (blocked && (event.key === "Enter" || event.key === " ")) {
          preventActivation(event)
          return
        }
        onKeyDown?.(event)
      }}
    >
      {renderContent(children)}
    </button>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
