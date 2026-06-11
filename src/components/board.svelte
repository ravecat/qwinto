<script lang="ts">
  import board from "~assets/board.svg";
  import { session, type Slot } from "~store/session";

  type BoardSlot = Slot & {
    x: number;
    y: number;
  };

  const slotSize = 43.228;
  const slotRadius = 7.856;

  const slots: BoardSlot[] = [
    { row: "orange", slot: 0, x: 101.738, y: 35.278 },
    { row: "orange", slot: 1, x: 147.013, y: 35.278 },
    { row: "orange", slot: 2, x: 192.288, y: 35.278 },
    { row: "orange", slot: 3, x: 282.838, y: 35.278 },
    { row: "orange", slot: 4, x: 328.113, y: 35.278 },
    { row: "orange", slot: 5, x: 373.388, y: 35.278 },
    { row: "orange", slot: 6, x: 418.663, y: 35.278 },
    { row: "orange", slot: 7, x: 463.938, y: 35.278 },
    { row: "orange", slot: 8, x: 509.213, y: 35.278 },
    { row: "yellow", slot: 0, x: 56.463, y: 97.125 },
    { row: "yellow", slot: 1, x: 101.738, y: 97.125 },
    { row: "yellow", slot: 2, x: 147.013, y: 97.125 },
    { row: "yellow", slot: 3, x: 192.288, y: 97.125 },
    { row: "yellow", slot: 4, x: 237.563, y: 97.125 },
    { row: "yellow", slot: 5, x: 328.113, y: 97.125 },
    { row: "yellow", slot: 6, x: 373.388, y: 97.125 },
    { row: "yellow", slot: 7, x: 418.663, y: 97.125 },
    { row: "yellow", slot: 8, x: 463.938, y: 97.125 },
    { row: "purple", slot: 0, x: 11.188, y: 158.972 },
    { row: "purple", slot: 1, x: 56.463, y: 158.972 },
    { row: "purple", slot: 2, x: 101.738, y: 158.972 },
    { row: "purple", slot: 3, x: 147.013, y: 158.972 },
    { row: "purple", slot: 4, x: 237.563, y: 158.972 },
    { row: "purple", slot: 5, x: 282.838, y: 158.972 },
    { row: "purple", slot: 6, x: 328.113, y: 158.972 },
    { row: "purple", slot: 7, x: 373.388, y: 158.972 },
    { row: "purple", slot: 8, x: 418.663, y: 158.972 },
  ];

  const availableSlots = $derived($session.value?.available_slots ?? []);
  const availableCellKeys = $derived(new Set(availableSlots.map(key)));

  function key({ row, slot }: Slot) {
    return `${row}:${slot}`;
  }
</script>

<div class="board" role="img" aria-label="Qwinto game board">
  <img class="board-art" src={board} alt="" aria-hidden="true" draggable="false" />

  <svg
    class="board-overlay"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-29.782 0 659.967 370.908"
    aria-hidden="true"
    focusable="false"
  >
    <g transform="translate(-15.455 5.016)">
      {#each slots as slot (key(slot))}
        {@const slotKey = key(slot)}
        {@const available = availableCellKeys.has(slotKey)}

        <g data-cell={slotKey} data-available={available ? "true" : undefined}>
          {#if available}
            <rect
              class="slot-available-ring"
              x={slot.x}
              y={slot.y}
              width={slotSize}
              height={slotSize}
              rx={slotRadius}
              ry={slotRadius}
            />
          {/if}
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  .board {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 659.967 / 370.908;
  }

  .board-art,
  .board-overlay {
    display: block;
    width: 100%;
    height: 100%;
  }

  .board-art {
    user-select: none;
  }

  .board-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .slot-available-ring {
    fill: none;
    stroke: #2f6fed;
    stroke-width: 3.2;
  }
</style>
