import { shell } from "@rvct/d20sdk";
import type {
  ActionError,
  ActionFeedbackSnapshot,
  DieColor,
  EmptyOk,
  Session,
  Slot,
} from "~/types/session";

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

export function actionErrorMessage(snapshot: ActionFeedbackSnapshot): string | null {
  for (const [bucket, error] of Object.entries(snapshot.errors)) {
    if (error === null) {
      continue;
    }

    return error.reason?.trim() || `${bucket} error`;
  }

  return null;
}

export function timeoutErrorMessage(snapshot: ActionFeedbackSnapshot): string | null {
  for (const [bucket, timedOut] of Object.entries(snapshot.timeouts)) {
    if (timedOut) {
      return `${bucket} timeout`;
    }
  }

  return null;
}
