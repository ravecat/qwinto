import { atom } from "nanostores";
import { vi } from "vitest";
import type { session as runtimeSession } from "~store/session";

type SessionState = Parameters<Parameters<typeof runtimeSession.subscribe>[0]>[0];

export function createSessionMock() {
  const actions = {
    roll: vi.fn(),
    keep: vi.fn(),
    reroll: vi.fn(),
    skip: vi.fn(),
  };
  const initialState = {
    value: null,
    status: "loading",
    error: null,
    processing: { roll: false, keep: false, reroll: false, skip: false },
    errors: { roll: null, keep: null, reroll: null, skip: null },
    timeouts: { roll: false, keep: false, reroll: false, skip: false },
  } satisfies SessionState;
  const state = atom<SessionState>(initialState);

  return {
    actions,
    session: {
      subscribe: state.subscribe,
      roll: actions.roll,
      keep: actions.keep,
      reroll: actions.reroll,
      skip: actions.skip,
    },
    set: state.set,
    reset() {
      state.set(initialState);
      actions.roll.mockReset();
      actions.keep.mockReset();
      actions.reroll.mockReset();
      actions.skip.mockReset();
    },
  };
}
