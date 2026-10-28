"use client"

import { useSyncExternalStore } from 'react'
import { Keyboard } from 'lucide-react'
import { Kbd, KbdGroup } from '@/components/coss/kbd'
import { Tooltip, TooltipTrigger } from '@/components/coss/tooltip'
import { TooltipPopup } from './scoped-overlays'
import { Button } from './button'

/** Deterministic server/first client render; detect the platform after hydration. */
const subscribePlatform = () => () => {}
const platformModifier = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl'
export function usePrimaryModifier() {
  return useSyncExternalStore(subscribePlatform, platformModifier, () => 'Ctrl')
}

export function KeyboardHint({ modifier }: { modifier: string }) {
  return <Tooltip>
    <TooltipTrigger render={<Button type="button" size="icon-sm" variant="ghost" aria-label="公式编辑快捷键" />}><Keyboard aria-hidden="true" /></TooltipTrigger>
    <TooltipPopup><dl className="grid gap-2">
      <div className="flex items-center justify-between gap-3"><dt>确认</dt><dd><KbdGroup><Kbd>{modifier}</Kbd><Kbd>↵</Kbd></KbdGroup></dd></div>
      <div className="flex items-center justify-between gap-3"><dt>取消</dt><dd><KbdGroup><Kbd>Esc</Kbd></KbdGroup></dd></div>
      <div className="flex items-center justify-between gap-3"><dt>移动光标</dt><dd><KbdGroup><Kbd>Tab</Kbd><Kbd>←</Kbd><Kbd>↑</Kbd><Kbd>→</Kbd><Kbd>↓</Kbd></KbdGroup></dd></div>
    </dl></TooltipPopup>
  </Tooltip>
}
