import { type Slot } from "~store/session";

export const selectedSlot = $state<{ value: Slot | null }>({
  value: null,
});

export function selectSlot({ row, slot }: Slot) {
  selectedSlot.value = { row, slot };
}

export function clearSelectedSlot() {
  selectedSlot.value = null;
}
