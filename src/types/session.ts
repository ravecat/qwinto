export type DieColor = "orange" | "yellow" | "purple";
export type Dice = Partial<Record<DieColor, number>>;
export type GamePhase = "setup" | "ready" | "roll" | "write_or_pass" | "result" | "finished";
export type SessionPhase = "waiting_for_players" | "in_progress" | "finished";
export type PlayerStatus = "idle" | "pending" | "wrote" | "skipped";

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

export type Slot = {
  row: DieColor;
  slot: number;
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
  can_roll: boolean;
  can_reroll: boolean;
  can_see_roll: boolean;
  can_write: boolean;
  can_pass: boolean;
  can_penalize: boolean;
};

export type Game = {
  phase: GamePhase;
  order: string[];
  cursor: number;
  players: Record<string, Player>;
  dices: Dice;
  sum: number | null;
  attempt: 0 | 1 | 2;
  scores: Record<string, Score>;
};

export type Session = {
  id: string;
  self: string;
  phase: SessionPhase;
  owner_id: string;
  members: Record<string, Member>;
  game: Game;
  permissions: Permissions;
  available_slots?: Slot[];
};

export type ActionError = {
  reason?: string;
};

export type EmptyOk = Record<string, never>;
