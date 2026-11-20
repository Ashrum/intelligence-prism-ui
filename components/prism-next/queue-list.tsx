"use client"

import { Button } from "./button"
import "./queue-list.css"

export type QueueListItem = {
  id: string
  title: string
  tag: { label: string; tone: "pink" | "sky"; live?: boolean }
  meta: { className: string; detail: string }
  date: string
  waitDays: number
  overdue: boolean
  actionLabel: string
} & ({ href: string; onAction?: never } | { href?: never; onAction: () => void })

export type QueueListProps = {
  items: readonly QueueListItem[]
  emptyText: string
}

export function QueueList({ items, emptyText }: QueueListProps) {
  if (items.length === 0) {
    return <p className="prism-queue-empty text-ui-hint">{emptyText}</p>
  }

  return <div className="prism-queue">
    <ul role="list" className="prism-queue-list">
      {items.map(({ id, title, tag, meta, date, waitDays, overdue, actionLabel, href, onAction }) => (
        <li key={id} className="prism-queue-row" onClick={onAction && (() => onAction())}>
          <div className="prism-queue-details">
            <div className="prism-queue-title-row">
              <span className="prism-queue-title text-item-title">{title}</span>
              <span className="prism-queue-tag text-ui-meta" data-tone={tag.tone}>
                {tag.live && <span className="prism-queue-live" aria-hidden="true" />}
                {tag.label}
              </span>
            </div>
            <p className="prism-queue-meta text-ui-meta">
              <strong>{meta.className}</strong><span className="prism-queue-separator">·</span>{meta.detail}
            </p>
          </div>
          <div className="prism-queue-controls">
            <div className="prism-queue-timing text-ui-meta tabular-nums">
              <div>{date}</div>
              <div className={overdue ? "prism-queue-overdue" : undefined}>已等待 {waitDays} 天</div>
            </div>
            <Button
              variant="outline"
              className="prism-queue-action"
              aria-label={`${actionLabel} · ${title}`}
              render={href !== undefined ? <a href={href} /> : undefined}
              onClick={onAction && (event => {
                event.stopPropagation()
                onAction()
              })}
            >
              {actionLabel}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  </div>
}
