import { derived, type Readable } from "svelte/store";
import { type Permissions, session } from "~store/session";

const permissions: Readable<Permissions> = derived(session, ($session) => ({
  can_start_game: false,
  can_select_dice: false,
  can_roll: false,
  can_keep: false,
  can_reroll: false,
  can_see_result: false,
  can_write_result: false,
  can_pass_result: false,
  can_take_penalty: false,
  ...$session.value?.permissions,
}));

export default permissions;
