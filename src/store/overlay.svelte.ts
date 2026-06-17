import type { Slot } from "~/types/session";

export const selectedSlot = $state<{ value: Slot | null }>({
  value: null,
});

export function selectSlot({ row, slot }: Slot) {
  const current = selectedSlot.value;
  selectedSlot.value = current?.row === row && current.slot === slot ? null : { row, slot };
}
