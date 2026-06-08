import { shell } from "@rvct/d20sdk";

export type Member = {
  online_at?: number;
  display_name?: string;
  avatar?: string | null;
};

export type Game = {
  order: string[];
  cursor: number;
};

export type Session = {
  members: Record<string, Member>;
  game: Game;
};

export const { connection, session } = shell<Session>(
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
