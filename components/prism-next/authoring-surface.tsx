"use client"

import { Children, Fragment, cloneElement, isValidElement, useId, type ComponentProps, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import './authoring-surface.css'

export type AuthoringSurfaceProps = Omit<ComponentProps<'div'>, 'title'> & {
  variant?: 'default' | 'floating'
  header?: ReactNode
  no?: ReactNode
  title?: ReactNode
  status?: ReactNode
  actions?: ReactNode
}

/** The host owns all content, status and actions, including the floating card's position. */
export function AuthoringSurface({ variant = 'default', header, no, title, status, actions, className, children, ...props }: AuthoringSurfaceProps) {
  const hasHeader = header != null || no != null || title != null || status != null || actions != null
  return <div {...props} data-slot="authoring-surface" data-variant={variant} className={cn('prism-authoring-surface', className)}>
    {hasHeader && <div className="prism-authoring-header" data-slot="authoring-header">{header ?? <>
      {no != null && <span className="prism-authoring-number text-ui-meta">{no}</span>}
      {title != null && <span className="text-item-title">{title}</span>}
      {status}
      {actions != null && <div className="prism-authoring-actions">{actions}</div>}
    </>}</div>}
    {children}
  </div>
}

export type AuthoringSectionProps = Omit<ComponentProps<'section'>, 'title'> & { no?: ReactNode; title?: ReactNode; hint?: ReactNode }
export function AuthoringSection({ no, title, hint, children, className, ...props }: AuthoringSectionProps) {
  const titleId = useId()
  return <section aria-labelledby={title != null ? titleId : undefined} {...props} data-slot="authoring-section" className={cn('prism-authoring-section', className)}>
    {(no != null || title != null || hint != null) && <header className="prism-authoring-section-heading">
      {no != null && <span className="prism-authoring-section-no text-ui-meta">{no}</span>}
      {title != null && <h3 id={titleId} className="text-item-title">{title}</h3>}
      {hint != null && <span className="text-ui-meta text-muted-foreground">{hint}</span>}
    </header>}
    {children}
  </section>
}

export type AuthoringRowProps = ComponentProps<'div'> & { label: ReactNode; htmlFor?: string; trailing?: ReactNode; note?: ReactNode }
export function AuthoringRow({ label, htmlFor, trailing, note, children, className, ...props }: AuthoringRowProps) {
  return <div {...props} data-slot="authoring-row" className={cn('prism-authoring-row', className)}>
    {htmlFor ? <label htmlFor={htmlFor} className="prism-authoring-label text-ui-body">{label}</label> : <div className="prism-authoring-label text-ui-body">{label}</div>}
    <div className="prism-authoring-content" data-slot="authoring-content">{children}{note != null && <div className="prism-authoring-note text-ui-meta">{note}</div>}</div>
    {trailing != null && <div className="prism-authoring-trailing" data-slot="authoring-trailing">{trailing}</div>}
  </div>
}

export type QuietFieldProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** One control/editor root that forwards className; its first nested coss control is the input surface. */
  children: ReactElement<{ className?: string }>
  toolbar?: ReactNode
  appearance?: 'quiet' | 'boxed'
  /** Boxed minimum writing lines; finite values are rounded up and clamped to one. */
  lines?: number
  leading?: ReactNode
  trailing?: ReactNode
  invalid?: boolean
  message?: ReactNode
}
export function QuietField({ appearance = 'quiet', lines, leading, trailing, invalid, message, children, toolbar, className, ...props }: QuietFieldProps) {
  if (appearance === 'boxed') return <BoxedQuietField {...props} {...{ lines, leading, trailing, invalid, message, children, toolbar, className }} />
  return <div {...props} data-slot="quiet-field" className={cn('prism-quiet-field', className)}>
    {cloneElement(children, { className: cn(children.props.className, 'prism-quiet-field-control') })}
    {toolbar != null && <div data-slot="quiet-field-toolbar" className="prism-quiet-field-toolbar">{toolbar}</div>}
  </div>
}

function BoxedQuietField({ lines = 1, leading, trailing, invalid, message, children, toolbar, className, style, ...props }: QuietFieldProps) {
  const messageId = useId()
  const hasMessage = message != null
  let marked = false
  // Traverse supplied DOM wrappers only. An opaque editor must forward these
  // attributes to its editable surface, just as coss Input / Textarea do.
  const markInput = (node: ReactNode): ReactNode => {
    if (marked || !isValidElement<ComponentProps<'div'>>(node)) return node
    if ((typeof node.type !== 'string' && node.type !== Fragment) || node.type === 'input' || node.type === 'textarea' || node.props.contentEditable === true || node.props.contentEditable === 'true' || node.props.contentEditable === 'plaintext-only') {
      marked = true
      return cloneElement(node, {
        className: cn(node.props.className, 'prism-quiet-field-input'),
        'aria-invalid': invalid ?? node.props['aria-invalid'],
        'aria-describedby': [node.props['aria-describedby'], hasMessage ? messageId : undefined].filter(Boolean).join(' ') || undefined,
      })
    }
    return node.props.children == null ? node : cloneElement(node, { children: Children.map(node.props.children, markInput) })
  }
  const control = markInput(children) as QuietFieldProps['children']
  const lineCount = Number.isFinite(lines) ? Math.max(1, Math.ceil(lines)) : 1
  return <>
    <div {...props} data-slot="quiet-field" data-appearance="boxed" data-invalid={invalid || undefined}
      className={cn('prism-quiet-field', className)} style={{ ...style, '--quiet-field-lines': lineCount } as CSSProperties}>
      {leading != null && <div data-slot="quiet-field-leading" className="prism-quiet-field-leading">{leading}</div>}
      {cloneElement(control, { className: cn(control.props.className, 'prism-quiet-field-control') })}
      {trailing != null && <div data-slot="quiet-field-trailing" className="prism-quiet-field-trailing">{trailing}</div>}
      {toolbar != null && <div data-slot="quiet-field-toolbar" className="prism-quiet-field-toolbar">{toolbar}</div>}
    </div>
    {hasMessage && <p id={messageId} data-slot="quiet-field-message" data-invalid={invalid || undefined} className="prism-quiet-field-message text-ui-meta">{message}</p>}
  </>
}

export type ChoiceKeyProps = Omit<ComponentProps<'button'>, 'aria-pressed'> & { selected?: boolean }
export function ChoiceKey({ selected = false, children, className, ...props }: ChoiceKeyProps) {
  return <Button type="button" {...props} variant={null} size={null} aria-pressed={selected} data-slot="choice-key" className={cn('prism-choice-key text-ui-meta', className)}>{children}</Button>
}

export type StatusDotProps = ComponentProps<'span'> & { tone?: 'ok' | 'miss' | 'ai' | 'check' | 'neutral' }
export function StatusDot({ tone = 'neutral', children, className, ...props }: StatusDotProps) {
  return <span {...props} data-slot="status-dot" data-tone={tone} className={cn('prism-status-dot text-ui-meta', className)}><i aria-hidden="true" />{children}</span>
}

export type AiSuggestState = 'idle' | 'loading' | 'done'
export type AiSuggestButtonProps = Omit<ComponentProps<'span'>, 'children'> & {
  state?: AiSuggestState
  label?: string
  disabled?: boolean
  onSuggest?: () => void
  onStop?: () => void
}
export function AiSuggestButton({ state = 'idle', label = 'AI 建议', disabled = false, onSuggest, onStop, className, ...props }: AiSuggestButtonProps) {
  return <span {...props} data-slot="ai-suggest-button" data-state={state} aria-busy={state === 'loading'} className={cn('prism-ai-suggest text-ui-meta', className)}>
    {state === 'loading' ? <>
      <span className="prism-ai-spinner" aria-hidden="true" />
      <span>生成中</span>
      <Button variant={null} size={null} disabled={disabled || !onStop} onClick={onStop} className="prism-ai-stop text-ui-meta">停止</Button>
    </> : <Button variant={null} size={null} disabled={disabled || !onSuggest} onClick={onSuggest} className="prism-ai-suggest-action text-ui-meta"><span aria-hidden="true">✦</span>{state === 'done' ? '换一个' : label}</Button>}
  </span>
}

export type AiSuggestFieldProps = ComponentProps<'div'> & { state?: AiSuggestState; empty?: boolean }
export function AiSuggestField({ state = 'idle', empty = false, children, className, ...props }: AiSuggestFieldProps) {
  return <div {...props} data-slot="ai-suggest-field" data-state={state} data-empty={empty} aria-busy={state === 'loading'} className={cn('prism-ai-field', className)}>
    <div className="prism-ai-field-body">
      {children}
      {state === 'loading' && empty && <div className="prism-ai-placeholder" data-slot="ai-placeholder" aria-hidden="true"><i /><i /></div>}
      {state === 'loading' && <span className="prism-ai-flow" aria-hidden="true" />}
    </div>
    {state === 'done' && <p className="prism-ai-field-note text-ui-meta">AI 建议 · 待确认</p>}
  </div>
}
