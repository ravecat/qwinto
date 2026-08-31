import { Factory } from "fishery";
import type { Game, Member, Permissions, Player, Session } from "~/types/session";
import type { session as runtimeSession } from "~store/session.svelte";

type SessionState = Parameters<Parameters<typeof runtimeSession.subscribe>[0]>[0];

type SessionOverrides = {
  game?: Partial<Game>;
  permissions?: Partial<Permissions>;
  session?: Partial<Omit<Session, "game" | "permissions">>;
};

export const members: Record<string, Member> = {
  alice: { display_name: "Alice", avatar: null },
  bob: { display_name: "Bob", avatar: null },
};

export const player = Factory.define<Player>(() => ({
  rows: {
    orange: {},
    yellow: {},
    purple: {},
  },
  penalties: 0,
  status: "idle",
}));

export const game = Factory.define<Game>(() => ({
  phase: "roll",
  order: ["alice", "bob"],
  cursor: 0,
  players: {
    alice: player.build(),
    bob: player.build(),
  },
  dices: {},
  sum: null,
  attempt: 0,
  scores: {},
}));

export const permissions = Factory.define<Permissions>(() => ({
  can_start_game: false,
  can_roll: false,
  can_reroll: false,
  can_see_roll: false,
  can_write: false,
  can_pass: false,
  can_penalize: false,
}));

export const session = Factory.define<Session, SessionOverrides>(({ transientParams }) => {
  const currentGame = game.build(transientParams.game);

  return {
    id: "session-test",
    self: "alice",
    phase: "in_progress",
    owner_id: "alice",
    members,
    ...transientParams.session,
    game: currentGame,
    permissions: permissions.build(transientParams.permissions),
  };
});

export const sessionState = Factory.define<SessionState, SessionOverrides>(
  ({ transientParams }) => ({
    value: session.transient(transientParams).build(),
    status: "ready",
    error: null,
    processing: {
      start: false,
      roll: false,
      reroll: false,
      write: false,
      pass: false,
      penalize: false,
    },
    errors: {
      start: null,
      roll: null,
      reroll: null,
      write: null,
      pass: null,
      penalize: null,
    },
    timeouts: {
      start: false,
      roll: false,
      reroll: false,
      write: false,
      pass: false,
      penalize: false,
    },
  }),
);
