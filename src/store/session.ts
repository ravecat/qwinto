import { shell } from "@rvct/d20sdk";

export type DieColor = "orange" | "yellow" | "purple";
export type GamePhase = "setup" | "ready" | "turn" | "decision" | "result" | "finished";
export type SessionPhase = "waiting_for_players" | "in_progress" | "finished";
export type PlayerStatus = "ready" | "wrote" | "failed" | "passed";

export type Member = {
  online_at?: number;
  display_name?: string;
  avatar?: string | null;
};

export type Player = {
  rows: Record<DieColor, Partial<Record<number, number>>>;
  penalties: number;
  status: PlayerStatus;
};

export type Score = {
  player_id: string;
  rows: Record<DieColor, number>;
  bonuses: number;
  penalties: number;
  total: number;
};

export type Permissions = {
  can_start_game: boolean;
  can_select_dice: boolean;
  can_roll: boolean;
  can_keep: boolean;
  can_reroll: boolean;
  can_see_result: boolean;
  can_write_result: boolean;
  can_pass_result: boolean;
  can_take_penalty: boolean;
};

export type Game = {
  phase: GamePhase;
  order: string[];
  cursor: number;
  players: Record<string, Player>;
  dices: DieColor[];
  values: number[];
  sum: number | null;
  attempt: 0 | 1 | 2;
  scores: Record<string, Score>;
};

export type Session = {
  id: string;
  phase: SessionPhase;
  owner_id: string;
  members: Record<string, Member>;
  game: Game;
  permissions: Permissions;
};

type ActionError = {
  reason?: string;
};

type EmptyOk = Record<string, never>;

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

  keep() {
    return call<EmptyOk, ActionError>("keep", {});
  },

  reroll() {
    return call<EmptyOk, ActionError>("reroll", {});
  },
}));

type SessionSnapshot = Parameters<Parameters<typeof session.subscribe>[0]>[0];
type ActionErrorBuckets = SessionSnapshot["errors"];
type ActionTimeoutBuckets = SessionSnapshot["timeouts"];
type ActionBucket = Extract<keyof ActionErrorBuckets & keyof ActionTimeoutBuckets, string>;

export function actionErrorMessage(snapshot: SessionSnapshot): string | null {
  for (const [bucket, error] of Object.entries(snapshot.errors) as [
    ActionBucket,
    ActionErrorBuckets[ActionBucket],
  ][]) {
    if (error === null) {
      continue;
    }

    return error.reason?.trim() || `${bucket} error`;
  }

  return null;
}

export function timeoutErrorMessage(snapshot: SessionSnapshot): string | null {
  for (const [bucket, timedOut] of Object.entries(snapshot.timeouts) as [
    ActionBucket,
    ActionTimeoutBuckets[ActionBucket],
  ][]) {
    if (timedOut) {
      return `${bucket} timeout`;
    }
  }

  return null;
}
