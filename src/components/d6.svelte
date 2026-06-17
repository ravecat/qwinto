<script lang="ts">
  type D6Value = 1 | 2 | 3 | 4 | 5 | 6;
  type DotPosition = { cx: number; cy: number };

  let { value } = $props<{ value?: number | null }>();

  const dotPositions = {
    1: [{ cx: 50, cy: 50 }],
    2: [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
    ],
    3: [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
      { cx: 50, cy: 50 },
    ],
    4: [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
      { cx: 72, cy: 28 },
      { cx: 28, cy: 72 },
    ],
    5: [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
      { cx: 72, cy: 28 },
      { cx: 28, cy: 72 },
      { cx: 50, cy: 50 },
    ],
    6: [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
      { cx: 72, cy: 28 },
      { cx: 28, cy: 72 },
      { cx: 28, cy: 50 },
      { cx: 72, cy: 50 },
    ],
  } satisfies Record<D6Value, readonly DotPosition[]>;

  const toD6Value = (nextValue: number | null | undefined): D6Value | undefined => {
    if (nextValue == null) {
      return undefined;
    }

    const numericValue = Number(nextValue);

    if (Number.isNaN(numericValue)) {
      return 1;
    }

    if (numericValue <= 1) {
      return 1;
    }

    if (numericValue >= 6) {
      return 6;
    }

    switch (Math.trunc(numericValue)) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 3:
        return 3;
      case 4:
        return 4;
      default:
        return 5;
    }
  };

  const d6Value = $derived(toD6Value(value));
</script>

<svg class="d6" viewBox="0 0 100 100" data-die-value={d6Value} aria-hidden="true" focusable="false">
  <rect class="d6-border" x="2.5" y="2.5" width="95" height="95" rx="12" />
  <rect class="d6-face" x="7" y="7" width="86" height="86" rx="9" />
  <path class="d6-edge d6-edge--top" d="M18 8.5H82" />
  <path class="d6-edge d6-edge--bottom" d="M18 91.5H82" />
  <path class="d6-edge d6-edge--left" d="M8.5 18V82" />
  <path class="d6-edge d6-edge--right" d="M91.5 18V82" />

  {#if d6Value}
    {#each dotPositions[d6Value] as { cx, cy }, dot (dot)}
      <circle class="d6-dot" data-die-pip="" {cx} {cy} r="8.5" />
    {/each}
  {/if}
</svg>

<style>
  .d6 {
    --d6-color: var(--color, #e7e7e7);
    --d6-dot-color: #20242b;
    --d6-dot-edge-color: color-mix(in oklab, var(--d6-dot-color), black 28%);

    display: block;
    width: 100%;
    height: auto;
    max-height: 100%;
    aspect-ratio: 1;
    pointer-events: none;
  }

  @supports (color: rgb(from red calc(r * 1) g b)) {
    .d6 {
      /* Choose white below the perceived-brightness threshold and black above it. */
      --d6-dot-color: rgb(
        from var(--d6-color) clamp(0, calc((128 - (0.299 * r + 0.587 * g + 0.114 * b)) * 1000), 255)
          clamp(0, calc((128 - (0.299 * r + 0.587 * g + 0.114 * b)) * 1000), 255)
          clamp(0, calc((128 - (0.299 * r + 0.587 * g + 0.114 * b)) * 1000), 255)
      );
    }
  }

  @supports (color: contrast-color(red)) {
    .d6 {
      --d6-dot-color: contrast-color(var(--d6-color));
    }
  }

  .d6-border {
    fill: color-mix(in oklab, var(--d6-color), black 14%);
  }

  .d6-face {
    fill: var(--d6-color);
  }

  .d6-edge {
    fill: none;
    stroke-linecap: round;
    stroke-width: 2.5;
  }

  .d6-edge--top {
    opacity: 0.48;
    stroke: color-mix(in oklab, var(--d6-color), white 38%);
  }

  .d6-edge--bottom {
    opacity: 0.46;
    stroke: color-mix(in oklab, var(--d6-color), black 22%);
  }

  .d6-edge--left,
  .d6-edge--right {
    opacity: 0.32;
    stroke: color-mix(in oklab, var(--d6-color), black 8%);
  }

  .d6-dot {
    fill: var(--d6-dot-color);
    stroke: var(--d6-dot-edge-color);
    stroke-width: 1.5;
  }
</style>
