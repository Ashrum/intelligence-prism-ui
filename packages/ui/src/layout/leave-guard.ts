export interface LeaveGuardHost {
  id: string;
  objectId: string | null;
  /** Supply a revision when the same host and object can start a new editing session. */
  revision?: string | number;
  dirty: boolean;
  discard: () => void;
  save?: () => Promise<void> | void;
  /** Reveals the host and restores focus to its field or a usable fallback. */
  returnToEdit: () => void;
}

export interface LeaveValidation {
  intentId: string;
  target: string;
  valid: boolean;
  /** Include affected hosts even after their saves clear the dirty flag. */
  hosts: readonly LeaveGuardHost[];
}

export interface LeaveIntent {
  id: string;
  target: string;
  /** Read current edit sessions and target validity, including permissions and route position. */
  read: () => LeaveValidation;
  navigate: () => void;
}

type HostIdentity = Pick<LeaveGuardHost, "id" | "objectId" | "revision">;
type EditLocation = Pick<LeaveGuardHost, "id" | "objectId" | "revision" | "returnToEdit">;

interface PendingLeave {
  token: number;
  intent: LeaveIntent;
  host?: HostIdentity;
}

export type LeaveGuardState = { lastToken: number } & (
  | { status: "idle" }
  | { status: "confirming"; pending: PendingLeave; host: EditLocation; canSaveAndLeave: boolean }
  | { status: "saving"; pending: PendingLeave; host: EditLocation }
  | { status: "blocked"; hosts: readonly EditLocation[] }
  | { status: "failed"; host: EditLocation; error: unknown }
);

export type LeaveGuardEvent =
  | { type: "request"; intent: LeaveIntent; live: LeaveValidation }
  | { type: "dismiss"; reason: "continue" | "escape" | "backdrop" }
  | { type: "discard" | "saveAndLeave" | "saveSucceeded"; token: number; live: LeaveValidation }
  | { type: "saveFailed"; token: number; live: LeaveValidation; error: unknown }
  | { type: "invalidate"; token?: number };

type LeaveCommand =
  | { type: "navigate"; pending: PendingLeave; discardHost?: LeaveGuardHost }
  | { type: "save"; pending: PendingLeave; save: NonNullable<LeaveGuardHost["save"]> };

export interface LeaveGuardTransition {
  state: LeaveGuardState;
  command?: LeaveCommand;
}

export const initialLeaveGuardState: LeaveGuardState = { status: "idle", lastToken: 0 };

export function isLeaveGuardBlocking(state: LeaveGuardState): boolean {
  return state.status === "confirming" || state.status === "saving" || state.status === "blocked";
}

function matchesIntent(intent: LeaveIntent, live: LeaveValidation): boolean {
  return live.valid && intent.id === live.intentId && intent.target === live.target;
}

function editLocation({ id, objectId, revision, returnToEdit }: LeaveGuardHost): EditLocation {
  return { id, objectId, revision, returnToEdit };
}

function currentHost(pending: PendingLeave, live: LeaveValidation): LeaveGuardHost | undefined {
  if (!matchesIntent(pending.intent, live)) return;
  if (live.hosts.some((host) => host.dirty && host.id !== pending.host?.id)) return;
  return live.hosts.find((host) =>
    host.id === pending.host?.id && host.objectId === pending.host.objectId && host.revision === pending.host.revision,
  );
}

/** Transitions use supplied snapshots; commands are executed by the controller. */
export function transitionLeaveGuard(state: LeaveGuardState, event: LeaveGuardEvent): LeaveGuardTransition {
  const idle: LeaveGuardState = { status: "idle", lastToken: state.lastToken };

  if (event.type === "invalidate") {
    if (event.token !== undefined && (!("pending" in state) || state.pending.token !== event.token)) return { state };
    return { state: state.status === "idle" ? state : idle };
  }

  if (event.type === "dismiss") {
    const dismissible = state.status === "confirming" || state.status === "blocked" || state.status === "failed";
    return { state: dismissible && event.reason !== "backdrop" ? idle : state };
  }

  if (event.type === "request") {
    if (isLeaveGuardBlocking(state) || !matchesIntent(event.intent, event.live)) return { state };
    const dirtyHosts = [...new Map(event.live.hosts.filter((host) => host.dirty)
      .map((host) => [host.id, host])).values()];
    const token = state.lastToken + 1;
    if (dirtyHosts.length > 1) {
      return { state: { status: "blocked", lastToken: token, hosts: dirtyHosts.map(editLocation) } };
    }
    const host = dirtyHosts[0];
    const { id, target, read, navigate } = event.intent;
    const pending: PendingLeave = { token, intent: { id, target, read, navigate } };
    if (!host) return { state: { ...idle, lastToken: token }, command: { type: "navigate", pending } };
    const location = editLocation(host);
    pending.host = { id: location.id, objectId: location.objectId, revision: location.revision };
    return { state: { status: "confirming", lastToken: token, pending, host: location, canSaveAndLeave: !!host.save } };
  }

  if (!("pending" in state) || state.pending.token !== event.token) return { state };
  const { pending } = state;
  if (event.type === "saveAndLeave" || event.type === "discard") {
    if (state.status !== "confirming") return { state };
    const host = currentHost(pending, event.live);
    if (!host) return { state: idle };
    if (event.type === "discard") {
      return { state: idle, command: { type: "navigate", pending, discardHost: host.dirty ? host : undefined } };
    }
    if (!state.canSaveAndLeave || !host.save) return { state };
    return {
      state: { status: "saving", lastToken: state.lastToken, pending, host: editLocation(host) },
      command: { type: "save", pending, save: host.save },
    };
  }

  if (state.status !== "saving") return { state };
  const host = currentHost(pending, event.live);
  if (!host) return { state: idle };
  if (event.type === "saveFailed") {
    return { state: { status: "failed", lastToken: state.lastToken, host: editLocation(host), error: event.error } };
  }
  return { state: idle, command: { type: "navigate", pending } };
}
