import { atom } from "nanostores";
import { vi } from "vitest";
import type { session as runtimeSession } from "~store/session";

type SessionState = Parameters<Parameters<typeof runtimeSession.subscribe>[0]>[0];

export function createSessionMock() {
  const actions = {
    roll: vi.fn(),
    reroll: vi.fn(),
    write: vi.fn(),
    pass: vi.fn(),
    penalize: vi.fn(),
  };
  const initialState = {
    value: null,
    status: "loading",
    error: null,
    processing: {
      roll: false,
      reroll: false,
      write: false,
      pass: false,
      penalize: false,
    },
    errors: {
      roll: null,
      reroll: null,
      write: null,
      pass: null,
      penalize: null,
    },
    timeouts: {
      roll: false,
      reroll: false,
      write: false,
      pass: false,
      penalize: false,
    },
  } satisfies SessionState;
  const state = atom<SessionState>(initialState);

  return {
    actions,
    session: {
      subscribe: state.subscribe,
      roll: actions.roll,
      reroll: actions.reroll,
      write: actions.write,
      pass: actions.pass,
      penalize: actions.penalize,
    },
    set: state.set,
    reset() {
      state.set(initialState);
      actions.roll.mockReset();
      actions.reroll.mockReset();
      actions.write.mockReset();
      actions.pass.mockReset();
      actions.penalize.mockReset();
    },
  };
}
