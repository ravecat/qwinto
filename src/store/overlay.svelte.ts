import { fromStore } from "svelte/store";
import { session, type Slot } from "~store/session";

const sessionState = fromStore(session);

export const selectedSlot = $state<{ value: Slot | null }>({
  value: null,
});

let selectedVisiblePlayerId = $state<string | null>(null);

export const visiblePlayerId = {
  get value() {
    return selectedVisiblePlayerId ?? sessionState.current.value?.self ?? null;
  },
  set value(playerId: string | null) {
    selectedVisiblePlayerId = playerId;
  },
};

export function selectSlot({ row, slot }: Slot) {
  const current = selectedSlot.value;
  selectedSlot.value = current?.row === row && current.slot === slot ? null : { row, slot };
}
