"use client"
import type { ReactNode, RefObject } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"
import { Group, GroupSeparator } from "@/components/coss/group"
import { Combobox, ComboboxTrigger, ComboboxPopup, ComboboxInput, ComboboxList, ComboboxGroup, ComboboxGroupLabel, ComboboxCollection, ComboboxItem, ComboboxEmpty } from "@/components/coss/combobox"
import "./review-workspace.css"
export type ReviewSwitcherGroup<T> = { value: string; items: T[] }
export type ReviewSwitcherProps<T> = {
  items: T[]; groups: ReviewSwitcherGroup<T>[]; current: number
  open: boolean; onOpenChange: (open: boolean) => void; onSelect: (index: number) => void
  triggerRef: RefObject<HTMLButtonElement | null>; searchId: string
  itemToStringLabel: (item: T) => string; itemKey: (item: T) => string | number; renderItem: (item: T) => ReactNode
  labels: { navigation: string; previous: string; next: string; previousAria: string; nextAria: string; trigger: string; panel: string; search: string; empty: ReactNode }
  footer?: ReactNode; currentLabel?: ReactNode; className?: string
}
/** Controlled navigation only. Search/group/selection/focus are provided by coss. */
export function ReviewSwitcher<T>({ items, groups, current, open, onOpenChange, onSelect, triggerRef, searchId, itemToStringLabel, itemKey, renderItem, labels, footer, currentLabel, className = "ml-auto shrink-0" }: ReviewSwitcherProps<T>) {
  return <Combobox items={groups} value={items[current] ?? null} open={open} onOpenChange={onOpenChange}
    itemToStringLabel={itemToStringLabel} onValueChange={item => { if (item) { const index = items.findIndex(candidate => itemKey(candidate) === itemKey(item)); if (index >= 0) onSelect(index) } }}>
    <Group className={className} aria-label={labels.navigation}>
      <Button variant="outline" size="default" aria-label={labels.previousAria} disabled={current <= 0 || !items.length} onClick={() => { if (current > 0) onSelect(current - 1) }}><ChevronLeft /><span className="d1-student-label">{labels.previous}</span></Button><GroupSeparator />
      <ComboboxTrigger ref={triggerRef} render={<Button variant="outline" size="default" />} aria-label={labels.trigger}>{currentLabel ?? <>{current + 1} / {items.length}</>}</ComboboxTrigger><GroupSeparator />
      <Button variant="outline" size="default" aria-label={labels.nextAria} disabled={!items.length || current >= items.length - 1} onClick={() => { if (current < items.length - 1) onSelect(current + 1) }}><span className="d1-student-label">{labels.next}</span><ChevronRight /></Button>
    </Group>
    <ComboboxPopup data-student-panel aria-label={labels.panel} className="surface-floating w-[360px] max-w-[calc(100vw-1rem)] motion-reduce:transition-none" finalFocus={triggerRef}>
      <div className="space-y-2 border-b p-2"><label htmlFor={searchId} className="block text-ui-action">{labels.search}</label><ComboboxInput id={searchId} size="default" showTrigger={false} /></div>
      <ComboboxEmpty>{labels.empty}</ComboboxEmpty>
      <ComboboxList>{(group: ReviewSwitcherGroup<T>) => <ComboboxGroup key={group.value} items={group.items}>
        <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
        <ComboboxCollection>{(item: T) => <ComboboxItem key={itemKey(item)} value={item}>{renderItem(item)}</ComboboxItem>}</ComboboxCollection>
      </ComboboxGroup>}</ComboboxList>
      {footer}
    </ComboboxPopup>
  </Combobox>
}
