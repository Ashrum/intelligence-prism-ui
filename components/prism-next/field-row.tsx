"use client"

import type { ComponentProps } from 'react'
import { Field } from '@/components/coss/field'
import { cn } from '@/lib/utils'
import './field-layout.css'

/** Label first; wraps against this field's available width, not the viewport. */
export function FieldRow({ className, ...props }: ComponentProps<typeof Field>) {
  return <Field {...props} className={cn('prism-field-row', className)} />
}
