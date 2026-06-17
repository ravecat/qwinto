<script lang="ts">
  import type { DieColor } from "~/types/session";
  import permissions from "~store/permissions";
  import { actionErrorMessage, session, timeoutErrorMessage } from "~store/session";

  const dieColors = ["orange", "yellow", "purple"] as const satisfies readonly DieColor[];
  const game = $derived($session.value?.game ?? null);

  let dice = $derived(Object.keys(game?.dices ?? {}) as DieColor[]);

  const canSeeRoll = $derived(
    ($permissions.can_see_roll || $permissions.can_write) && Boolean(game?.sum),
  );
  const canRoll = $derived($permissions.can_roll && !$session.processing.roll);
  const actionError = $derived(actionErrorMessage($session));
  const timeoutError = $derived(timeoutErrorMessage($session));

  function roll() {
    session.roll({ colors: dice });
  }
</script>

<div class="side-panel side-panel--dice">
  <fieldset
    class="dice-stack"
    class:dice-stack--can-roll={canRoll}
    class:dice-stack--can-see-roll={canSeeRoll}
    disabled={!canRoll}
    aria-label="Dice"
  >
    {#each dieColors as color (color)}
      <label class="die-option">
        <input
          class="die die--{color}"
          type="checkbox"
          name="dice"
          bind:group={dice}
          value={color}
          aria-label="{color} die"
        />

        {#if canSeeRoll && game?.dices[color]}
          <span class="die-value" aria-hidden="true">
            {game.dices[color]}
          </span>
        {/if}
      </label>
    {/each}
  </fieldset>

  {#if game?.phase === "roll"}
    <button
      class="roll-button"
      type="button"
      aria-label="Roll selected dice"
      disabled={!canRoll || dice.length === 0}
      onclick={roll}
    >
      Roll
    </button>
  {/if}

  {#if actionError}
    <p class="action-error" aria-live="polite">
      {actionError}
    </p>
  {:else if timeoutError}
    <p class="action-error" aria-live="polite">
      {timeoutError}
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

  .die-option,
  .roll-button {
    width: min(100%, 3rem);
    aspect-ratio: 1;
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

  .die-option {
    display: grid;
    cursor: pointer;
  }

  .die {
    grid-area: 1 / 1;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 0;
    border: 0.12rem solid transparent;
    margin: 0;
    -webkit-appearance: none;
    appearance: none;
    color: #ffffff;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.24),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.22);
    cursor: pointer;
    font: inherit;
    font-size: clamp(1rem, 2.6vmin, 1.35rem);
    font-weight: 800;
    line-height: 1;
  }

  .die:disabled {
    cursor: default;
  }

  .die--orange {
    background: var(--game-orange);
  }

  .die--yellow {
    background: var(--game-yellow);
  }

  .die--purple {
    background: var(--game-purple);
  }

  .dice-stack--can-roll .die:checked {
    border-color: #ffffff;
    outline: 0.16rem solid var(--game-orange);
    outline-offset: 0.1rem;
  }

  .dice-stack:not(.dice-stack--can-roll) .die:checked {
    border-color: #ffffff;
    outline: 0.16rem solid rgb(51 56 64 / 0.24);
    outline-offset: 0.1rem;
  }

  .dice-stack--can-see-roll:not(.dice-stack--can-roll) .die:not(:checked) {
    opacity: 0.36;
  }

  .die:focus-visible {
    outline: 0.16rem solid var(--game-orange);
    outline-offset: 0.14rem;
  }

  .die-value {
    z-index: 1;
    grid-area: 1 / 1;
    place-self: center;
    color: #ffffff;
    font-size: clamp(1rem, 2.6vmin, 1.35rem);
    font-weight: 800;
    line-height: 1;
    pointer-events: none;
    text-shadow: 0 0.08rem 0.1rem rgb(0 0 0 / 0.34);
  }

  .roll-button {
    display: grid;
    place-items: center;
    padding: 0;
    border: 0.12rem solid #858585;
    border-radius: 0;
    background: #ffffff;
    color: #333840;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.72),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.12);
    cursor: pointer;
    font: inherit;
    font-size: clamp(0.825rem, 2.25vmin, 1.08rem);
    font-weight: 700;
    line-height: 1;
  }

  .roll-button:hover:not(:disabled) {
    background: #eef0f4;
  }

  .roll-button:active:not(:disabled) {
    transform: translateY(0.04rem);
  }

  .roll-button:focus-visible {
    outline: 0.16rem solid #2f6fed;
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

    .die-option,
    .roll-button {
      width: min(100%, 2.15rem);
    }
  }
</style>
