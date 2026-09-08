import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, CircleCheck, CircleMinus, CircleX, Clock3, Info, LoaderCircle, Sparkles, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

// Metadata is static. Actions belong to Button, links or selection controls.
const badgeVariants = cva("meta-badge", {
  variants: {
    variant: {
      default: "meta-badge--neutral",
      outline: "meta-badge--outline",
    },
  },
  defaultVariants: { variant: "default" },
})

function Badge({ className, variant = "default", children, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span {...props} data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)}><span className="label-text">{children}</span></span>
}

const stateIcons = {
  neutral: CircleMinus,
  info: Info,
  running: LoaderCircle,
  completed: Check,
  success: CircleCheck,
  pending: Clock3,
  warning: TriangleAlert,
  danger: CircleX,
} as const

type StateLabelTone = keyof typeof stateIcons

// Static labels do not announce themselves. The owning workflow supplies one
// live region for meaningful updates, rather than one per label in a list.
function StateLabel({ tone = "neutral", className, children, ...props }: React.ComponentProps<"span"> & { tone?: StateLabelTone }) {
  const Icon = stateIcons[tone]
  return <span {...props} data-slot="state-label" data-state={tone} className={cn("state-label", `state-label--${tone}`, className)}><Icon aria-hidden="true" /><span className="label-text">{children}</span></span>
}

function AILabel({ className, children, ...props }: React.ComponentProps<"span">) {
  return <span {...props} data-slot="ai-label" className={cn("ai-label", className)}><Sparkles aria-hidden="true" /><span className="label-text">{children}</span></span>
}

export { Badge, badgeVariants, StateLabel, AILabel }
export type { StateLabelTone }
