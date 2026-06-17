<script lang="ts">
  import type { DieColor } from "~/types/session";
  import D6 from "~components/d6.svelte";
  import { dice } from "~store/overlay.svelte";
  import permissions from "~store/permissions";
  import { errors, session } from "~store/session.svelte";

  const colors = ["orange", "yellow", "purple"] as const satisfies readonly DieColor[];
  const dieFaces = {
    orange: "var(--game-orange)",
    yellow: "var(--game-yellow)",
    purple: "var(--game-purple)",
  } satisfies Record<DieColor, string>;

  const game = $derived($session.value?.game ?? null);
  const canSeeRoll = $derived(
    ($permissions.can_see_roll || $permissions.can_write) && Boolean(game?.sum),
  );
  const canRoll = $derived($permissions.can_roll && !$session.processing.roll);
</script>

<div class="side-panel side-panel--dice">
  <fieldset
    class="dice-stack"
    class:dice-stack--can-roll={canRoll}
    disabled={!canRoll}
    aria-label="Dice"
  >
    {#each colors as color (color)}
      {@const value = canSeeRoll ? game?.dices[color] : undefined}

      <label class="die-option" data-die-color={color}>
        <input
          class="die-input"
          type="checkbox"
          name="dice"
          bind:group={dice.value}
          value={color}
          aria-label="{color} die"
        />

        <span class="die-option-figure">
          <D6 {value} --color={dieFaces[color]} />
        </span>
      </label>
    {/each}
  </fieldset>

  {#if $errors.error}
    <p class="action-error" aria-live="polite">
      {$errors.error}
    </p>
  {:else if $errors.timeout}
    <p class="action-error" aria-live="polite">
      {$errors.timeout}
    </p>
  {/if}
</div>

<style>
  .side-panel {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: clamp(0.35rem, 1.3vmin, 0.65rem);
    min-width: 0;
    padding: clamp(0.4rem, 1.2vmin, 0.65rem);
    margin: 0;
    border: 0;
    border-radius: 0;
    background: #f6f7f9;
    list-style: none;
  }

  .side-panel--dice {
    border-inline-start: 0.08rem solid var(--surface-border);
  }

  .die-option {
    display: grid;
    place-items: center;
    container-type: size;
    width: min(100%, 3rem);
    aspect-ratio: 1;
    cursor: pointer;
  }

  .dice-stack {
    display: grid;
    justify-items: center;
    gap: inherit;
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    margin: 0;
  }

  .dice-stack:disabled .die-option {
    cursor: default;
  }

  .die-input {
    z-index: 1;
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    margin: 0;
    cursor: pointer;
    opacity: 0;
  }

  .die-input:disabled {
    cursor: default;
  }

  .die-option-figure {
    display: grid;
    grid-area: 1 / 1;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  @supports (width: min(100cqi, 100cqb)) {
    .die-option-figure {
      width: min(100cqi, 100cqb);
      height: min(100cqi, 100cqb);
    }
  }

  .die-option:has(.die-input:checked) .die-option-figure {
    outline: 0.16rem solid rgb(51 56 64 / 0.24);
    outline-offset: 0.1rem;
  }

  .dice-stack--can-roll .die-option:has(.die-input:checked) .die-option-figure,
  .die-option:has(.die-input:focus-visible) .die-option-figure {
    outline-color: var(--game-orange);
  }

  .die-option:has(.die-input:focus-visible) .die-option-figure {
    outline-style: solid;
    outline-width: 0.16rem;
    outline-offset: 0.14rem;
  }

  .action-error {
    max-width: 100%;
    margin: 0;
    color: #9a2a2a;
    font-size: clamp(0.55rem, 1.35vmin, 0.68rem);
    font-weight: 700;
    line-height: 1.1;
    text-align: center;
    overflow-wrap: anywhere;
  }

  @media (max-width: 640px) {
    .side-panel {
      padding: 0.35rem;
    }

    .die-option {
      width: min(100%, 2.15rem);
    }
  }
</style>
