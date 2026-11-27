"use client";

import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PortalScope, usePortalProps, type PortalContainer } from "../portal-scope.js";
import { useMediaQuery } from "../use-media-query.js";
import { dialogWidths, workbenchLayout, type DialogSize } from "./contracts.js";
import { useLeaveGuard, useLeaveGuardState } from "./leave-guard-context.js";

export interface WorkbenchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: DialogSize;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  dismissible?: boolean;
  allowBackdropExit?: boolean;
  initialFocus?: Dialog.Popup.Props["initialFocus"];
  finalFocus?: Dialog.Popup.Props["finalFocus"];
  container?: PortalContainer;
}

function WorkbenchModal({
  open, onOpenChange, size = "md", title, description, children, footer, closeLabel = "关闭",
  dismissible = true, allowBackdropExit = true, initialFocus, finalFocus, container, confirmation = false,
}: WorkbenchDialogProps & { confirmation?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [visual, setVisual] = useState<{ height: number; top: number }>();
  const portalProps = usePortalProps({ container });
  const desktop = useMediaQuery(`(min-width: ${workbenchLayout.fullScreenWidth}px)`);
  const depth = confirmation ? "confirmation" : "first";
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) return;
    const measure = () => setVisual({ height: viewport.height, top: viewport.offsetTop });
    measure();
    viewport.addEventListener("resize", measure);
    viewport.addEventListener("scroll", measure);
    return () => {
      viewport.removeEventListener("resize", measure);
      viewport.removeEventListener("scroll", measure);
    };
  }, [open]);

  return (
    <Dialog.Root open={open} modal disablePointerDismissal={!dismissible || !allowBackdropExit}
      onOpenChange={(next, details) => {
        if (!next && (!dismissible || (details.reason === "escape-key" && details.event.repeat))) {
          details.cancel();
          return;
        }
        onOpenChange(next);
      }}>
      <Dialog.Portal {...portalProps} data-slot="workbench-dialog-portal">
        <Dialog.Backdrop data-slot="workbench-dialog-backdrop" data-depth={depth} forceRender={confirmation} />
        <div data-slot="workbench-dialog-viewport" data-depth={depth} data-viewport={desktop ? "desktop" : "mobile"}
          style={visual && {
            "--wb-dialog-viewport-height": `${visual.height}px`,
            "--wb-dialog-viewport-top": `${visual.top}px`,
          } as CSSProperties}>
          <Dialog.Popup data-slot="workbench-dialog" data-size={size} data-viewport={desktop ? "desktop" : "mobile"}
            role={confirmation ? "alertdialog" : "dialog"} aria-modal="true"
            initialFocus={initialFocus ?? (() => closeRef.current ?? true)} finalFocus={finalFocus}
            style={{ "--wb-dialog-size": `${dialogWidths[size]}px` } as CSSProperties}>
            <header data-slot="workbench-dialog-header">
              <Dialog.Title title={title}>{title}</Dialog.Title>
              {dismissible && (
                <Dialog.Close ref={closeRef} data-slot="workbench-action" aria-label={closeLabel} title={closeLabel}>
                  <XIcon aria-hidden="true" size={16} />
                </Dialog.Close>
              )}
            </header>
            <PortalScope container={host}>
              <div data-slot="workbench-dialog-body">
                {description != null && <Dialog.Description>{description}</Dialog.Description>}
                {children}
              </div>
              {footer != null && <footer data-slot="workbench-dialog-footer">{footer}</footer>}
            </PortalScope>
            <div ref={setHost} data-slot="workbench-dialog-light-host" data-depth={depth} />
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** First-level modal. Use LeaveConfirmDialog for a nested leave confirmation. */
export function WorkbenchDialog(props: WorkbenchDialogProps) {
  return <WorkbenchModal {...props} />;
}

export interface LeaveConfirmDialogProps {
  /** In an active navigation Drawer, render the blocked/failed message in its body. */
  presentation?: "dialog" | "inline";
  /** Use the inline presentation for these states while a navigation Drawer is active. */
  inlineStatuses?: readonly ("blocked" | "failed")[];
  hostLabel?: (hostId: string, objectId: string | null) => string;
  /** Start a fresh retry for the current edit. The failed navigation intent has been cleared. */
  onRetry?: (hostId: string) => void;
  errorMessage?: (error: unknown) => string;
  finalFocus?: WorkbenchDialogProps["finalFocus"];
}

export function LeaveConfirmDialog({
  presentation = "dialog", inlineStatuses,
  hostLabel = (id) => id, onRetry, errorMessage = (error) => error instanceof Error ? error.message : "保存失败，请重试。",
  finalFocus,
}: LeaveConfirmDialogProps) {
  const guard = useLeaveGuard();
  const state = useLeaveGuardState();
  const continueRef = useRef<HTMLButtonElement>(null);
  const saving = state.status === "saving";
  const dismiss = () => guard.dismiss("continue");
  const continueButton = (
    <button data-slot="workbench-action" type="button" ref={continueRef} onClick={dismiss} disabled={saving}>继续编辑</button>
  );
  const inline = (state.status === "blocked" || state.status === "failed") && (inlineStatuses?.includes(state.status) ?? presentation === "inline");
  const open = state.status !== "idle" && (presentation === "inline" ? inline : !inline);
  const title = state.status === "blocked" ? "有多处未保存修改"
    : state.status === "failed" ? "保存未完成" : "离开编辑？";
  let content: ReactNode;
  let footer: ReactNode;

  switch (state.status) {
    case "blocked":
      content = (
        <>
          <p>请处理以下编辑位置，再重新发起离开。</p>
          <ul data-slot="workbench-leave-hosts">
            {state.hosts.map((host) => (
              <li key={host.id}>
                <span>{hostLabel(host.id, host.objectId)}</span>
                <button data-slot="workbench-action" type="button" onClick={() => guard.returnToEdit(host.id)}>返回编辑</button>
              </li>
            ))}
          </ul>
        </>
      );
      footer = continueButton;
      break;
    case "failed":
      content = <p role="alert" data-slot="workbench-dialog-error">{errorMessage(state.error)}</p>;
      footer = (
        <>
          <button data-slot="workbench-action" type="button" onClick={() => guard.returnToEdit(state.host.id)}>返回编辑</button>
          {onRetry && <button data-slot="workbench-action" data-primary type="button" onClick={() => onRetry(state.host.id)}>重试</button>}
        </>
      );
      break;
    case "saving":
    case "confirming":
      content = <p role="status">{saving ? "正在保存修改…" : `${hostLabel(state.host.id, state.host.objectId)}有未保存修改。`}</p>;
      footer = (
        <>
          {continueButton}
          <button data-slot="workbench-action" type="button" disabled={saving} onClick={() => guard.discard(state.pending.token)}>放弃修改</button>
          {(saving || state.canSaveAndLeave) && (
            <button data-slot="workbench-action" data-primary type="button" disabled={saving} aria-busy={saving}
              onClick={() => guard.saveAndLeave(state.pending.token)}>
              {saving ? "保存中…" : "保存后离开"}
            </button>
          )}
        </>
      );
      break;
  }

  if (presentation === "inline") {
    return open ? (
      <section data-slot="workbench-leave-inline" aria-label={title}>
        <h2>{title}</h2>
        {content}
        <div data-slot="workbench-leave-actions">{footer}</div>
      </section>
    ) : null;
  }

  return (
    <WorkbenchModal confirmation size="sm" open={open} title={title} footer={footer}
      onOpenChange={(next) => { if (!next) dismiss(); }} dismissible={!saving} allowBackdropExit={false}
      initialFocus={() => continueRef.current ?? true} finalFocus={finalFocus}>
      {content}
    </WorkbenchModal>
  );
}
