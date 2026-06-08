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
};

export type ActionError = {
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
}));
