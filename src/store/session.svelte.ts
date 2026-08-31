import { shell } from "@rvct/d20sdk";
import { derived, fromStore } from "svelte/store";
import type { ActionError, DieColor, EmptyOk, Session, Slot } from "~/types/session";

const runtime = shell<Session>(
  {
    allowedOrigins: ["*"],
  },
  {
    connect: {
      ok: (_, payload: Session) => payload,
    },
    events: {
      projection: (_, payload: Session) => payload,
    },
  },
);

export const connection = runtime.connection;

export const session = runtime.session.extend(({ call }) => ({
  start() {
    return call<EmptyOk, ActionError>("start", {});
  },

  roll(payload: { colors: DieColor[] }) {
    return call<EmptyOk, ActionError>("roll", payload);
  },

  reroll() {
    return call<EmptyOk, ActionError>("reroll", {});
  },

  write(payload: Slot) {
    return call<EmptyOk, ActionError>("write", payload);
  },

  pass() {
    return call<EmptyOk, ActionError>("pass", {});
  },

  penalize() {
    return call<EmptyOk, ActionError>("penalize", {});
  },
}));

const sessionState = fromStore(session);

let selectedVisiblePlayerId = $state<string | null>(null);
let selectedVisiblePlayerPhase = $state<string | null>(null);

export type Errors = {
  error: string | null;
  timeout: string | null;
};

export const errors = derived(session, ($session): Errors => {
  let error: string | null = null;

  for (const [bucket, actionError] of Object.entries($session.errors)) {
    if (actionError === null) {
      continue;
    }

    error = actionError.reason?.trim() || `${bucket} error`;
    break;
  }

  let timeout: string | null = null;

  for (const [bucket, timedOut] of Object.entries($session.timeouts)) {
    if (timedOut) {
      timeout = `${bucket} timeout`;
      break;
    }
  }

  return { error, timeout };
});

export const visiblePlayerId = {
  get value() {
    const currentSession = sessionState.current.value;
    const currentPhase = currentSession?.game.phase ?? null;
    const scopedPlayerId =
      selectedVisiblePlayerPhase === currentPhase ? selectedVisiblePlayerId : null;

    return scopedPlayerId ?? currentSession?.self ?? null;
  },
  set value(playerId: string | null) {
    selectedVisiblePlayerId = playerId;
    selectedVisiblePlayerPhase = sessionState.current.value?.game.phase ?? null;
  },
};
