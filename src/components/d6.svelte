<script lang="ts">
  let { value }: { value?: number | null } = $props();
</script>

<span
  class="die"
  data-die-value={value ?? undefined}
  aria-hidden="true"
>
  {#each Array.from({ length: value ?? 0 }, (_, dot) => dot) as dot (dot)}
    <span class="die-dot"></span>
  {/each}
</span>

<style>
  .die {
    display: grid;
    grid-template-areas:
      "a . c"
      "e g f"
      "d . b";
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 10%;
    border-radius: 10%;
    background-color: var(--color, #e7e7e7);
    box-shadow:
      inset 0 0.14rem color-mix(in oklab, var(--color, #e7e7e7), white 70%),
      inset 0 -0.14rem color-mix(in oklab, var(--color, #e7e7e7), black 24%),
      inset 0.14rem 0 color-mix(in oklab, var(--color, #e7e7e7), black 8%),
      inset -0.14rem 0 color-mix(in oklab, var(--color, #e7e7e7), black 8%);
    pointer-events: none;
  }

  .die-dot {
    display: block;
    grid-area: a;
    align-self: center;
    justify-self: center;
    width: 85%;
    aspect-ratio: 1;
    border-radius: 50%;
    background-color: #333;
    box-shadow:
      inset 0 0.08rem #111,
      inset 0 -0.08rem #555;
  }

  .die-dot:nth-child(2) {
    grid-area: b;
  }

  .die-dot:nth-child(3) {
    grid-area: c;
  }

  .die-dot:nth-child(4) {
    grid-area: d;
  }

  .die-dot:nth-child(5) {
    grid-area: e;
  }

  .die-dot:nth-child(6) {
    grid-area: f;
  }

  .die-dot:nth-child(odd):last-child {
    grid-area: g;
  }
</style>
