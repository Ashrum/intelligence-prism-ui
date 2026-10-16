"use client"

import type { ComponentProps } from "react"
import { SelectPopup as CossSelectPopup } from "@/components/coss/select"
import { ComboboxPopup as CossComboboxPopup } from "@/components/coss/combobox"
import { MenuPopup as CossMenuPopup, type MenuSubPopup as CossMenuSubPopup } from "@/components/coss/menu"
import { DialogPopup as CossDialogPopup } from "@/components/coss/dialog"
import { PopoverPopup as CossPopoverPopup } from "@/components/coss/popover"
import { TooltipPopup as CossTooltipPopup } from "@/components/coss/tooltip"
import { DrawerPopup as CossDrawerPopup } from "@/components/coss/drawer"
import { ToastProvider as CossToastProvider } from "@/components/coss/toast"
import { usePrismPortalProps } from "./prism-scope"

// Preserve the pinned coss props, refs, markup, focus and positioning behavior.
// Only the Portal target gains a host-owned default.
export function SelectPopup({ portalProps, ...props }: ComponentProps<typeof CossSelectPopup>) {
  return <CossSelectPopup {...props} portalProps={usePrismPortalProps(portalProps)} />
}
export function ComboboxPopup({ portalProps, ...props }: ComponentProps<typeof CossComboboxPopup>) {
  return <CossComboboxPopup {...props} portalProps={usePrismPortalProps(portalProps)} />
}
export function MenuPopup({ portalProps, ...props }: ComponentProps<typeof CossMenuPopup>) {
  return <CossMenuPopup {...props} portalProps={usePrismPortalProps(portalProps)} />
}
export function DialogPopup({ portalProps, ...props }: ComponentProps<typeof CossDialogPopup>) {
  return <CossDialogPopup {...props} portalProps={usePrismPortalProps(portalProps)} />
}
export function PopoverPopup({ portalProps, ...props }: ComponentProps<typeof CossPopoverPopup>) {
  return <CossPopoverPopup {...props} portalProps={usePrismPortalProps(portalProps)} />
}
export function TooltipPopup({ portalProps, ...props }: ComponentProps<typeof CossTooltipPopup>) {
  return <CossTooltipPopup {...props} portalProps={usePrismPortalProps(portalProps)} />
}
export function DrawerPopup({ portalProps, ...props }: ComponentProps<typeof CossDrawerPopup>) {
  return <CossDrawerPopup {...props} portalProps={usePrismPortalProps(portalProps)} />
}
export function ToastProvider({ portalProps, ...props }: ComponentProps<typeof CossToastProvider>) {
  return <CossToastProvider {...props} portalProps={usePrismPortalProps(portalProps)} />
}

export type MenuSubPopupProps = ComponentProps<typeof CossMenuSubPopup> & Pick<ComponentProps<typeof CossMenuPopup>, "portalProps">

/** Same submenu positioning as coss; adds the missing public Portal contract without editing coss. */
export function MenuSubPopup({ sideOffset = 0, alignOffset, align = "start", ...props }: MenuSubPopupProps) {
  return <MenuPopup align={align} alignOffset={alignOffset ?? (align !== "center" ? -5 : undefined)}
    data-slot="menu-sub-content" side="inline-end" sideOffset={sideOffset} {...props} />
}
