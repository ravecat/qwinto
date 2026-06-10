import { Factory } from "fishery";
import type {
  Game,
  Member,
  Permissions,
  Player,
  session as runtimeSession,
  Session,
} from "~store/session";

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
  status: "ready",
}));

export const game = Factory.define<Game>(() => ({
  phase: "turn",
  order: ["alice", "bob"],
  cursor: 0,
  players: {
    alice: player.build(),
    bob: player.build(),
  },
  dices: [],
  values: [],
  sum: null,
  attempt: 0,
  scores: {},
}));

export const permissions = Factory.define<Permissions>(() => ({
  can_start_game: false,
  can_select_dice: false,
  can_roll: false,
  can_keep: false,
  can_reroll: false,
  can_write_result: false,
  can_pass_result: false,
  can_take_penalty: false,
}));

export const session = Factory.define<Session, SessionOverrides>(({ transientParams }) => {
  const currentGame = game.build(transientParams.game);

  return {
    id: "session-test",
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
    processing: { roll: false, keep: false, reroll: false },
    errors: { roll: null, keep: null, reroll: null },
    timeouts: { roll: false, keep: false, reroll: false },
  }),
);
