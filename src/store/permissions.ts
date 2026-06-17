import { derived, type Readable } from "svelte/store";
import type { Permissions } from "~/types/session";
import { session } from "~store/session";

const permissions: Readable<Permissions> = derived(session, ($session) => ({
  can_start_game: false,
  can_roll: false,
  can_reroll: false,
  can_see_roll: false,
  can_write: false,
  can_pass: false,
  can_penalize: false,
  ...$session.value?.permissions,
}));

export default permissions;
