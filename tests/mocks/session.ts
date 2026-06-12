import { atom } from "nanostores";
import { vi } from "vitest";
import type { session as runtimeSession } from "~store/session";

type SessionState = Parameters<Parameters<typeof runtimeSession.subscribe>[0]>[0];

export function createSessionMock() {
  const actions = {
    roll: vi.fn(),
    keep: vi.fn(),
    reroll: vi.fn(),
    write: vi.fn(),
    skip: vi.fn(),
    takePenalty: vi.fn(),
  };
  const initialState = {
    value: null,
    status: "loading",
    error: null,
    processing: {
      roll: false,
      keep: false,
      reroll: false,
      write: false,
      skip: false,
      takePenalty: false,
    },
    errors: {
      roll: null,
      keep: null,
      reroll: null,
      write: null,
      skip: null,
      takePenalty: null,
    },
    timeouts: {
      roll: false,
      keep: false,
      reroll: false,
      write: false,
      skip: false,
      takePenalty: false,
    },
  } satisfies SessionState;
  const state = atom<SessionState>(initialState);

  return {
    actions,
    session: {
      subscribe: state.subscribe,
      roll: actions.roll,
      keep: actions.keep,
      reroll: actions.reroll,
      write: actions.write,
      skip: actions.skip,
      takePenalty: actions.takePenalty,
    },
    set: state.set,
    reset() {
      state.set(initialState);
      actions.roll.mockReset();
      actions.keep.mockReset();
      actions.reroll.mockReset();
      actions.write.mockReset();
      actions.skip.mockReset();
      actions.takePenalty.mockReset();
    },
  };
}
