<script lang="ts">
  import board from "~assets/board.svg";
  import permissions from "~store/permissions";
  import { selectedSlot, selectSlot } from "~store/overlay.svelte";
  import { session, type Slot } from "~store/session";

  type BoardSlot = Slot & {
    x: number;
    y: number;
  };

  const viewBoxWidth = 659.967;
  const viewBoxHeight = 370.908;
  const viewBoxMinX = -29.782;
  const groupTranslateX = -15.455;
  const groupTranslateY = 5.016;
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

  const canSelectSlot = $derived($permissions.can_write);
  const availableSlots = $derived($session.value?.available_slots ?? []);
</script>

<div class="board" role="group" aria-label="Qwinto game board">
  <img class="board-art" src={board} alt="" aria-hidden="true" draggable="false" />

  <svg
    class="board-overlay"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-29.782 0 659.967 370.908"
    aria-hidden="true"
    focusable="false"
  >
    <g transform="translate(-15.455 5.016)">
      {#each slots as slot (slot)}
        {@const available = availableSlots.some(
          (availableSlot) => availableSlot.row === slot.row && availableSlot.slot === slot.slot,
        )}
        {@const selected =
          selectedSlot.value?.row === slot.row && selectedSlot.value.slot === slot.slot}

        <g data-row={slot.row} data-slot={slot.slot}>
          {#if available}
            <rect
              class="slot-available-ring"
              class:slot-available-ring--selected={selected}
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

  {#if canSelectSlot}
    <div class="board-hit-layer" aria-label="Available cells">
      {#each slots as slot (slot)}
        {@const available = availableSlots.some(
          (availableSlot) => availableSlot.row === slot.row && availableSlot.slot === slot.slot,
        )}
        {@const selected =
          selectedSlot.value?.row === slot.row && selectedSlot.value.slot === slot.slot}

        {#if available}
          <button
            class="slot-hit-target"
            style:left={`${((slot.x + groupTranslateX - viewBoxMinX) / viewBoxWidth) * 100}%`}
            style:top={`${((slot.y + groupTranslateY) / viewBoxHeight) * 100}%`}
            style:width={`${(slotSize / viewBoxWidth) * 100}%`}
            style:height={`${(slotSize / viewBoxHeight) * 100}%`}
            type="button"
            aria-label="Select {slot.row} slot {slot.slot + 1}"
            aria-pressed={selected}
            onclick={() => selectSlot(slot)}
          ></button>
        {/if}
      {/each}
    </div>
  {/if}
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

  .slot-available-ring--selected {
    fill: rgb(47 111 237 / 0.18);
  }

  .board-hit-layer {
    position: absolute;
    inset: 0;
  }

  .slot-hit-target {
    position: absolute;
    padding: 0;
    border: 0;
    border-radius: 0.45rem;
    background: transparent;
    cursor: pointer;
  }

  .slot-hit-target:focus-visible {
    outline: 0.16rem solid #111827;
    outline-offset: 0.08rem;
  }
</style>
