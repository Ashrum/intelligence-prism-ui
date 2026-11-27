"use client";

import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  initialLeaveGuardState,
  isLeaveGuardBlocking,
  transitionLeaveGuard,
  type LeaveGuardEvent,
  type LeaveGuardState,
  type LeaveIntent,
  type LeaveValidation,
} from "./leave-guard.js";

function readIntent(intent: LeaveIntent): LeaveValidation {
  try {
    return intent.read();
  } catch {
    return { valid: false, intentId: intent.id, target: intent.target, hosts: [] };
  }
}

/** A synchronous dispatcher keeps React events and asynchronous saves on the same state. */
export function createLeaveGuardController() {
  let state = initialLeaveGuardState;
  let navigation: { token: number; invalidated: boolean } | undefined;
  const listeners = new Set<() => void>();

  function dispatch(event: LeaveGuardEvent): void {
    const transition = transitionLeaveGuard(state, event);
    if (transition.state === state) return;
    state = transition.state;
    const command = transition.command;
    if (command?.type === "navigate") {
      const execution = { token: command.pending.token, invalidated: false };
      navigation = execution;
      try {
        const { discardHost } = command;
        if (discardHost) {
          try {
            discardHost.discard();
          } catch (error) {
            const { id, objectId, revision, returnToEdit } = discardHost;
            if (!execution.invalidated) {
              state = { status: "failed", lastToken: state.lastToken, error, host: { id, objectId, revision, returnToEdit } };
            }
            return;
          }
        }
        if (!execution.invalidated) command.pending.intent.navigate();
      } finally {
        navigation = undefined;
        listeners.forEach((listener) => listener());
      }
      return;
    }
    listeners.forEach((listener) => listener());
    if (command?.type === "save") {
      const { token, intent } = command.pending;
      const isCurrentSave = () => state.status === "saving" && state.pending.token === token;
      if (!isCurrentSave()) return;
      // The rejection handler is paired with the save, so a navigation error cannot become a save failure.
      void Promise.resolve().then(() => {
        if (isCurrentSave()) return command.save();
      }).then(
        () => {
          if (isCurrentSave()) dispatch({ type: "saveSucceeded", token, live: readIntent(intent) });
        },
        (error: unknown) => {
          if (isCurrentSave()) dispatch({ type: "saveFailed", token, live: readIntent(intent), error });
        },
      );
    }
  }

  function confirm(type: "discard" | "saveAndLeave", token: number): void {
    if (state.status !== "confirming" || state.pending.token !== token) return;
    if (type === "saveAndLeave" && !state.canSaveAndLeave) return;
    dispatch({ type, token, live: readIntent(state.pending.intent) });
  }

  return {
    getState: (): LeaveGuardState => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    request(intent: LeaveIntent) {
      if (!navigation && !isLeaveGuardBlocking(state)) {
        dispatch({ type: "request", intent, live: readIntent(intent) });
      }
    },
    dismiss(reason: "continue" | "escape" | "backdrop") {
      dispatch({ type: "dismiss", reason });
    },
    discard(token: number) { confirm("discard", token); },
    saveAndLeave(token: number) { confirm("saveAndLeave", token); },
    invalidate(token?: number) {
      if (navigation && (token === undefined || token === navigation.token)) navigation.invalidated = true;
      dispatch({ type: "invalidate", token });
    },
    returnToEdit(hostId: string) {
      const host = state.status === "blocked" ? state.hosts.find(({ id }) => id === hostId)
        : state.status === "failed" && state.host.id === hostId ? state.host : undefined;
      if (!host) return;
      dispatch({ type: "invalidate" });
      host.returnToEdit();
    },
  };
}

export type LeaveGuardController = ReturnType<typeof createLeaveGuardController>;
const LeaveGuardContext = createContext<LeaveGuardController | null>(null);

export function LeaveGuardProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(createLeaveGuardController);
  useLayoutEffect(() => () => controller.invalidate(), [controller]);
  return <LeaveGuardContext.Provider value={controller}>{children}</LeaveGuardContext.Provider>;
}

/** Allows a host to use a leave guard when one is present in its workbench. */
export function useOptionalLeaveGuard(): LeaveGuardController | null {
  return useContext(LeaveGuardContext);
}

/** Read actions without subscribing to every change in the active confirmation. */
export function useLeaveGuard(): LeaveGuardController {
  const controller = useOptionalLeaveGuard();
  if (!controller) throw new Error("useLeaveGuard requires LeaveGuardProvider");
  return controller;
}

/** Subscribe the active confirmation surface to updates. */
export function useLeaveGuardState(): LeaveGuardState {
  const controller = useLeaveGuard();
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}
