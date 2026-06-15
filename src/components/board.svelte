<script lang="ts">
  import board from "~assets/board.svg";
  import permissions from "~store/permissions";
  import { selectedSlot, selectSlot, visiblePlayerId } from "~store/overlay.svelte";
  import { session, type Slot } from "~store/session";

  type BoardSlot = {
    row: Slot["row"];
    col: number;
    x: number;
    y: number;
  };

  type PenaltySlot = {
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
  const penaltyMarkRadius = 9.6;

  const slots: BoardSlot[] = [
    { row: "orange", col: 0, x: 101.738, y: 35.278 },
    { row: "orange", col: 1, x: 147.013, y: 35.278 },
    { row: "orange", col: 2, x: 192.288, y: 35.278 },
    { row: "orange", col: 3, x: 282.838, y: 35.278 },
    { row: "orange", col: 4, x: 328.113, y: 35.278 },
    { row: "orange", col: 5, x: 373.388, y: 35.278 },
    { row: "orange", col: 6, x: 418.663, y: 35.278 },
    { row: "orange", col: 7, x: 463.938, y: 35.278 },
    { row: "orange", col: 8, x: 509.213, y: 35.278 },
    { row: "yellow", col: 0, x: 56.463, y: 97.125 },
    { row: "yellow", col: 1, x: 101.738, y: 97.125 },
    { row: "yellow", col: 2, x: 147.013, y: 97.125 },
    { row: "yellow", col: 3, x: 192.288, y: 97.125 },
    { row: "yellow", col: 4, x: 237.563, y: 97.125 },
    { row: "yellow", col: 5, x: 328.113, y: 97.125 },
    { row: "yellow", col: 6, x: 373.388, y: 97.125 },
    { row: "yellow", col: 7, x: 418.663, y: 97.125 },
    { row: "yellow", col: 8, x: 463.938, y: 97.125 },
    { row: "purple", col: 0, x: 11.188, y: 158.972 },
    { row: "purple", col: 1, x: 56.463, y: 158.972 },
    { row: "purple", col: 2, x: 101.738, y: 158.972 },
    { row: "purple", col: 3, x: 147.013, y: 158.972 },
    { row: "purple", col: 4, x: 237.563, y: 158.972 },
    { row: "purple", col: 5, x: 282.838, y: 158.972 },
    { row: "purple", col: 6, x: 328.113, y: 158.972 },
    { row: "purple", col: 7, x: 373.388, y: 158.972 },
    { row: "purple", col: 8, x: 418.663, y: 158.972 },
  ];

  const penaltySlots: PenaltySlot[] = [
    { x: 440.277, y: 242.433 },
    { x: 485.552, y: 242.433 },
    { x: 530.827, y: 242.433 },
    { x: 598.196, y: 242.433 },
  ];

  const game = $derived($session.value?.game ?? null);
  const self = $derived($session.value?.self ?? null);
  const sheetPlayerId = $derived(visiblePlayerId.value);
  const isOwnSheet = $derived(sheetPlayerId === self);

  const canSelectSlot = $derived(isOwnSheet && $permissions.can_write);
  const availableSlots = $derived(isOwnSheet ? ($session.value?.available_slots ?? []) : []);
  const sheet = $derived(sheetPlayerId ? (game?.players[sheetPlayerId]?.rows ?? null) : null);
  const penalties = $derived(
    penaltySlots.slice(0, game?.players[sheetPlayerId ?? ""]?.penalties ?? 0),
  );
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
      {#each slots as { row, col, x, y } (`${row}-${col}`)}
        {@const available = availableSlots.some((slot) => slot.row === row && slot.slot === col)}
        {@const selected = selectedSlot.value?.row === row && selectedSlot.value.slot === col}
        {@const value = sheet?.[row]?.[col]}

        <g data-row={row} data-col={col}>
          {#if available}
            <rect
              data-slot-ring
              class="slot-available-ring"
              class:slot-available-ring--selected={selected}
              {x}
              {y}
              width={slotSize}
              height={slotSize}
              rx={slotRadius}
              ry={slotRadius}
            />
          {/if}

          {#if value !== undefined}
            <text
              data-slot-value
              class="slot-value"
              x={x + slotSize / 2}
              y={y + slotSize / 2}
              text-anchor="middle"
              dominant-baseline="central"
            >
              {value}
            </text>
          {/if}
        </g>
      {/each}

      {#each penalties as { x, y }, index (index)}
        <g class="penalty-mark" data-penalty={index}>
          <line
            x1={x - penaltyMarkRadius}
            y1={y - penaltyMarkRadius}
            x2={x + penaltyMarkRadius}
            y2={y + penaltyMarkRadius}
          />
          <line
            x1={x + penaltyMarkRadius}
            y1={y - penaltyMarkRadius}
            x2={x - penaltyMarkRadius}
            y2={y + penaltyMarkRadius}
          />
        </g>
      {/each}
    </g>
  </svg>

  {#if canSelectSlot}
    <div class="board-hit-layer" aria-label="Available cells">
      {#each slots as { row, col, x, y } (`${row}-${col}`)}
        {@const available = availableSlots.some((slot) => slot.row === row && slot.slot === col)}
        {@const selected = selectedSlot.value?.row === row && selectedSlot.value.slot === col}

        {#if available}
          <button
            class="slot-hit-target"
            style:left={`${((x + groupTranslateX - viewBoxMinX) / viewBoxWidth) * 100}%`}
            style:top={`${((y + groupTranslateY) / viewBoxHeight) * 100}%`}
            style:width={`${(slotSize / viewBoxWidth) * 100}%`}
            style:height={`${(slotSize / viewBoxHeight) * 100}%`}
            type="button"
            aria-label="Select {row} column {col + 1}"
            aria-pressed={selected}
            onclick={() => selectSlot({ row, slot: col })}
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

  .slot-value {
    fill: #111827;
    stroke: #ffffff;
    stroke-width: 2;
    paint-order: stroke;
    font-size: 1.45rem;
    font-weight: 700;
    pointer-events: none;
    user-select: none;
  }

  .penalty-mark {
    stroke: #9a2a2a;
    stroke-width: 4.2;
    stroke-linecap: round;
    pointer-events: none;
    user-select: none;
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
