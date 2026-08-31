import type { session as runtimeSession } from "../../src/store/session.svelte";

type SessionState = Parameters<Parameters<typeof runtimeSession.subscribe>[0]>[0];
type Listener<T> = (value: T) => void;
type ReplyStatus = "ok" | "error" | "timeout";

function createStore<T>(initial: T) {
  let current = initial;
  const listeners = new Set<Listener<T>>();

  return {
    set(value: T) {
      current = value;
      for (const listener of listeners) listener(current);
    },
    subscribe(listener: Listener<T>) {
      listener(current);
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
  };
}

const initialState = {
  value: null,
  status: "loading",
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
} satisfies SessionState;

function inertRequest<Ok, Error>() {
  type Payload = Ok | Error;

  const request = {
    receive(status: ReplyStatus, callback: (payload?: Payload) => unknown) {
      void status;
      void callback;
      return request;
    },
  };

  return request;
}

const connection = createStore({ error: null, status: "loading" });
const projection = createStore<SessionState>(initialState);
const session = Object.assign(projection, {
  extend(defineExtension: (context: { call: typeof inertRequest }) => object) {
    return Object.assign(session, defineExtension({ call: inertRequest }));
  },
});

export function reset() {
  projection.set(initialState);
}

export function set(state: SessionState) {
  projection.set(state);
}

export function shell() {
  return { connection, session };
}
