"use client"
import { useId,type ReactNode } from "react"
import { ArrowUp,Check,Circle,Square } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { Spinner } from "@/components/coss/spinner"
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/coss/input-group"
import { Separator } from "@/components/coss/separator"
export function AgentComposer({
  value, onChange, running = false, onSubmit, onStop, label = "任务",
  placeholder = "描述需要完成的任务…", submitLabel = "运行", maxLength = 1000,
  variant = "default", footerNote, context, suggestions, tools, attachments, toolbarLayout = "responsive", toolbarSeparator = false, inputSize = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  running?: boolean;
  onSubmit: () => void;
  onStop?: () => void;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  maxLength?: number;
  variant?: "default" | "compact" | "conversation";
  footerNote?: ReactNode;
  context?: ReactNode;
  suggestions?: ReactNode;
  tools?: ReactNode;
  attachments?: ReactNode;
  toolbarLayout?: "responsive" | "inline";
  toolbarSeparator?: boolean;
  inputSize?: "default" | "compact";
}) {
  const id = useId();
  const compact = variant === "compact";
  const stop = () => { onStop?.(); requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: true })); };
  const submit = () => { if (!running && value.trim()) onSubmit(); };
  if (variant === "conversation") {
    return <form className="relative min-w-0 space-y-3" onSubmit={event => { event.preventDefault(); submit(); }}>
      <Label htmlFor={id} className="sr-only">{label}</Label>
      <InputGroup className="@container/agent-composer">
        {attachments && <InputGroupAddon align="block-start" className="min-w-0 flex-wrap">{attachments}</InputGroupAddon>}
        <InputGroupTextarea
          id={id}
          value={value}
          onChange={event => onChange(event.target.value)}
          disabled={running}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={inputSize === "compact" ? 2 : 4}
          className={inputSize === "compact" ? "[&>textarea]:min-h-16 [&>textarea]:max-h-40 [&>textarea]:overflow-y-auto" : "[&>textarea]:min-h-28 [&>textarea]:max-h-60 [&>textarea]:overflow-y-auto"}
          onKeyDown={event => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {toolbarSeparator && <div className="w-full px-3 pb-3"><Separator /></div>}
        <InputGroupAddon align="block-end" className={toolbarLayout === "inline" ? "min-w-0 flex-row items-center gap-2" : "min-w-0 flex-col items-stretch gap-2 @min-[420px]/agent-composer:flex-row @min-[420px]/agent-composer:items-center"}>
          {tools && <div className={toolbarLayout === "inline" ? "flex min-w-0 max-w-full flex-1 items-center gap-1" : "flex min-w-0 max-w-full items-center gap-1 @min-[420px]/agent-composer:flex-1"}>{tools}</div>}
          <div className="ml-auto flex min-w-0 max-w-full items-center justify-end gap-2">
            {context}
            {running
              ? <Button type="button" variant="outline" size="icon" aria-label="停止" disabled={!onStop} onClick={stop}><Square aria-hidden="true" /></Button>
              : <Button type="submit" size="icon" aria-label={submitLabel} disabled={!value.trim()}><ArrowUp aria-hidden="true" /></Button>}
          </div>
        </InputGroupAddon>
      </InputGroup>
      <div className="min-w-0 text-xs text-muted-foreground">{footerNote ?? <>{value.length} / {maxLength} · Ctrl / ⌘ + Enter</>}</div>
      {suggestions}
    </form>;
  }
  return <form className={compact ? "relative space-y-2" : "relative space-y-3"} onSubmit={event => { event.preventDefault(); submit(); }}>
    <Label htmlFor={id} className={compact ? "sr-only" : undefined}>{label}</Label>
    <Textarea
      id={id}
      value={value}
      onChange={event => onChange(event.target.value)}
      disabled={running}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={compact ? 2 : undefined}
      className={compact ? "[&>textarea]:min-h-12" : undefined}
      onKeyDown={event => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
          event.preventDefault();
          submit();
        }
      }}
    />
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 text-xs text-muted-foreground">{footerNote ?? <>{value.length} / {maxLength} · Ctrl / ⌘ + Enter</>}</div>
      <div className="flex shrink-0 items-center gap-2">
        {context}
        {running
          ? <Button type="button" variant="outline" size={compact ? "icon" : "default"} aria-label={compact ? "停止" : undefined} disabled={!onStop} onClick={stop}><Square aria-hidden="true" />{!compact && "停止"}</Button>
          : <Button type="submit" size={compact ? "icon" : "default"} aria-label={compact ? submitLabel : undefined} disabled={!value.trim()}><ArrowUp aria-hidden="true" />{!compact && submitLabel}</Button>}
      </div>
    </div>
    {suggestions}
  </form>;
}
export function AgentTaskProgress({steps,actions}:{steps:{id:string;label:string;state:"done"|"running"|"pending"|"error"}[];actions?:ReactNode}){return <div><ol className="space-y-3 border-l pl-4 py-4 text-sm">{steps.map(step=><li key={step.id} className="flex items-center gap-3">{step.state==="done"?<Check className="size-4 text-success-foreground"/>:step.state==="running"?<Spinner/>:<Circle className="size-3 text-muted-foreground"/>}<span className={step.state==="pending"?"text-muted-foreground":""}>{step.label}</span><span className="ml-auto text-xs text-muted-foreground">{{done:"完成",running:"进行中",pending:"未完成",error:"失败"}[step.state]}</span></li>)}</ol>{actions}</div>}
