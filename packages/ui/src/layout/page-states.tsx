"use client";

import { useId, type ReactNode } from "react";

type StateContent = { title?: string; description?: ReactNode };
export type PageStatePanelProps = StateContent & (
  | { state: "loading" | "forbidden" | "empty" }
  | { state: "error"; onRetry: () => void }
  | { state: "no-results"; onReset: () => void }
  | { state: "partial-success"; onRetryFailed: () => void }
);

const titles = {
  loading: "正在加载",
  error: "加载失败",
  forbidden: "无权限",
  empty: "无数据",
  "no-results": "筛选无结果",
  "partial-success": "部分成功",
} as const;

export function PageStatePanel(props: PageStatePanelProps) {
  const { state, title = titles[state], description } = props;
  const id = useId();
  const action = state === "error" ? { label: "重试", run: props.onRetry }
    : state === "no-results" ? { label: "重置筛选", run: props.onReset }
    : state === "partial-success" ? { label: "重试失败项", run: props.onRetryFailed } : undefined;

  return (
    <section data-slot="workbench-page-state" data-state={state} aria-labelledby={id}>
      <div role={state === "error" ? "alert" : "status"}>
        <h2 id={id}>{title}</h2>
        {description != null && <div data-slot="workbench-page-state-description">{description}</div>}
      </div>
      {action && <button data-slot="workbench-action" type="button" onClick={action.run}>{action.label}</button>}
    </section>
  );
}
