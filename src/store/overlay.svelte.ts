import { fromStore } from "svelte/store";
import type { DieColor, Slot } from "~/types/session";
import { session } from "~store/session.svelte";

const sessionState = fromStore(session);
const currentDices = $derived(sessionState.current.value?.game.dices ?? null);
let diceValue = $derived(Object.keys(currentDices ?? {}) as DieColor[]);

export const dice = {
  get value() {
    return diceValue;
  },
  set value(colors: DieColor[]) {
    diceValue = colors;
  },
};

export const selectedSlot = $state<{ value: Slot | null }>({
  value: null,
});

export function selectSlot({ row, slot }: Slot) {
  const current = selectedSlot.value;

  selectedSlot.value = current?.row === row && current.slot === slot ? null : { row, slot };
}
