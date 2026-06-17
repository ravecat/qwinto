<script lang="ts">
  let { value }: { value?: number | null } = $props();

  const dotPositions = [
    [],
    [{ cx: 50, cy: 50 }],
    [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
    ],
    [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
      { cx: 50, cy: 50 },
    ],
    [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
      { cx: 72, cy: 28 },
      { cx: 28, cy: 72 },
    ],
    [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
      { cx: 72, cy: 28 },
      { cx: 28, cy: 72 },
      { cx: 50, cy: 50 },
    ],
    [
      { cx: 28, cy: 28 },
      { cx: 72, cy: 72 },
      { cx: 72, cy: 28 },
      { cx: 28, cy: 72 },
      { cx: 28, cy: 50 },
      { cx: 72, cy: 50 },
    ],
  ] as const;
</script>

<svg
  class="die"
  viewBox="0 0 100 100"
  data-die-value={value ?? undefined}
  aria-hidden="true"
  focusable="false"
>
  <rect class="die-border" x="2.5" y="2.5" width="95" height="95" rx="12" />
  <rect class="die-face" x="7" y="7" width="86" height="86" rx="9" />
  <path class="die-edge die-edge--top" d="M18 8.5H82" />
  <path class="die-edge die-edge--bottom" d="M18 91.5H82" />
  <path class="die-edge die-edge--left" d="M8.5 18V82" />
  <path class="die-edge die-edge--right" d="M91.5 18V82" />

  {#each dotPositions[value ?? 0] ?? [] as { cx, cy }, dot (dot)}
    <circle class="die-dot" {cx} {cy} r="8.5" />
  {/each}
</svg>

<style>
  .die {
    --die-color: var(--color, #e7e7e7);
    --die-dot-color: #20242b;
    --die-dot-edge-color: color-mix(in oklab, var(--die-dot-color), black 28%);

    display: block;
    width: 100%;
    height: auto;
    max-height: 100%;
    aspect-ratio: 1;
    pointer-events: none;
  }

  @supports (color: rgb(from red calc(r * 1) g b)) {
    .die {
      /* Choose white below the perceived-brightness threshold and black above it. */
      --die-dot-color: rgb(
        from var(--die-color)
          clamp(0, calc((128 - (0.299 * r + 0.587 * g + 0.114 * b)) * 1000), 255)
          clamp(0, calc((128 - (0.299 * r + 0.587 * g + 0.114 * b)) * 1000), 255)
          clamp(0, calc((128 - (0.299 * r + 0.587 * g + 0.114 * b)) * 1000), 255)
      );
    }
  }

  @supports (color: contrast-color(red)) {
    .die {
      --die-dot-color: contrast-color(var(--die-color));
    }
  }

  .die-border {
    fill: color-mix(in oklab, var(--die-color), black 14%);
  }

  .die-face {
    fill: var(--die-color);
  }

  .die-edge {
    fill: none;
    stroke-linecap: round;
    stroke-width: 2.5;
  }

  .die-edge--top {
    opacity: 0.48;
    stroke: color-mix(in oklab, var(--die-color), white 38%);
  }

  .die-edge--bottom {
    opacity: 0.46;
    stroke: color-mix(in oklab, var(--die-color), black 22%);
  }

  .die-edge--left,
  .die-edge--right {
    opacity: 0.32;
    stroke: color-mix(in oklab, var(--die-color), black 8%);
  }

  .die-dot {
    fill: var(--die-dot-color);
    stroke: var(--die-dot-edge-color);
    stroke-width: 1.5;
  }
</style>
