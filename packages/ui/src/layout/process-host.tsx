"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ProcessAction = "save" | "submit" | "next";

export interface ProcessActionState {
  disabled?: boolean;
  pending?: boolean;
}

export interface ProcessHostControls {
  actions: Readonly<Partial<Record<ProcessAction, ProcessActionState>>>;
  pendingAction?: ProcessAction;
  run: (action: ProcessAction) => void;
}

export interface ProcessHostProps {
  title?: ReactNode;
  /** When set, the host owns the title and actions for all templates inside it. */
  ownsHeader?: boolean;
  back?: ReactNode;
  steps?: ReactNode;
  actions: Readonly<Partial<Record<ProcessAction, ProcessActionState>>>;
  onAction: (action: ProcessAction) => void;
  save?: (state: ProcessActionState, run: () => void) => ReactNode;
  submit?: (state: ProcessActionState, run: () => void) => ReactNode;
  next?: (state: ProcessActionState, run: () => void) => ReactNode;
  children: ReactNode;
}

const ProcessContext = createContext<(ProcessHostControls & { ownsHeader: boolean; hasChrome: boolean }) | null>(null);

export function useProcessHost() {
  return useContext(ProcessContext);
}

export function ProcessHost({
  title, ownsHeader = false, back, steps, actions, onAction, save, submit, next, children,
}: ProcessHostProps) {
  const order = ["save", "submit", "next"] as const;
  const pendingAction = order.find((action) => actions[action]?.pending);
  const actionStates: Partial<Record<ProcessAction, ProcessActionState>> = {};
  for (const action of order) {
    const state = actions[action];
    if (state) actionStates[action] = { ...state, disabled: !!pendingAction || !!state.disabled };
  }
  const run = (action: ProcessAction) => {
    if (actionStates[action] && !actionStates[action].disabled) onAction(action);
  };
  const slots = { save, submit, next };
  const hasActions = order.some((action) => slots[action] && actionStates[action]);
  const hasChrome = ownsHeader || steps != null || hasActions;

  return (
    <ProcessContext.Provider value={{ actions: actionStates, pendingAction, run, ownsHeader, hasChrome }}>
      <section data-slot="workbench-process-host">
        {hasChrome && (
          <header data-slot="workbench-process-chrome" aria-busy={!!pendingAction}>
            {(ownsHeader || hasActions) && (
              <div data-slot="workbench-process-heading">
                {ownsHeader && back}
                {ownsHeader && title != null && <h1 data-slot="workbench-page-title">{title}</h1>}
                <div data-slot="workbench-process-actions">
                  {order.map((action) => {
                    const state = actionStates[action];
                    const slot = slots[action];
                    return state && slot && (
                      <div key={action} data-action={action}>
                        {slot(state, () => run(action))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {steps != null && <div data-slot="workbench-process-steps">{steps}</div>}
          </header>
        )}
        {children}
      </section>
    </ProcessContext.Provider>
  );
}
