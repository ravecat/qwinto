<script lang="ts">
  import Board from "~components/board.svelte";
  import { type DieColor, session } from "~store/session";

  const dice: DieColor[] = ["orange", "yellow", "purple"];

  const game = $derived($session.value?.game ?? null);

  const activeMemberId = $derived.by(() => {
    return game?.order[game.cursor] ?? null;
  });

  let selectedDice: DieColor[] = $derived.by(() => {
    if (game?.phase === "decision" || game?.phase === "result") {
      return game.dices;
    }

    return [];
  });

  const rollResultVisible = $derived(game?.phase === "decision" || game?.phase === "result");

  const decisionPending = $derived(game?.phase === "decision" && game?.attempt === 1);

  const decisionDisabled = $derived(
    $session.status !== "ready" ||
      !decisionPending ||
      $session.processing.keep ||
      $session.processing.reroll,
  );

  const rollDisabled = $derived(
    $session.status !== "ready" ||
      game?.phase !== "turn" ||
      selectedDice.length === 0 ||
      $session.processing.roll,
  );

  const actionError = $derived(
    $session.errors.roll?.reason ??
      $session.errors.keep?.reason ??
      $session.errors.reroll?.reason ??
      ($session.timeouts.roll || $session.timeouts.keep || $session.timeouts.reroll
        ? "timeout"
        : null),
  );

  function rolledValueForColor(color: DieColor) {
    const index = game?.dices.indexOf(color) ?? -1;

    return index >= 0 ? (game?.values[index] ?? null) : null;
  }

  function toggleDie(color: DieColor) {
    if (game?.phase !== "turn") {
      return;
    }

    selectedDice = selectedDice.includes(color)
      ? selectedDice.filter((current) => current !== color)
      : [...selectedDice, color];
  }

  function roll() {
    session.roll({ colors: selectedDice });
  }

  function keep() {
    session.keep();
  }

  function reroll() {
    session.reroll();
  }
</script>

<main class="game">
  <div class="play-surface">
    <ul
      class="side-panel side-panel--participants"
      aria-label="Participants"
    >
      {#each Object.entries($session.value?.members ?? {}) as [ id, member ] (id)}
        <li
          class="participant-slot participant-slot--occupied"
          class:participant-slot--active={id === activeMemberId}
          aria-current={id === activeMemberId ? "true" : undefined}
          aria-label={member.display_name || "Player"}
        >
          {#if member.avatar}
            <img
              class="participant-avatar"
              src={member.avatar}
              alt=""
              loading="eager"
              decoding="async"
              referrerpolicy="no-referrer"
            >
          {:else}
            <span
              class="participant-initial"
              aria-hidden="true"
            >
              {(member.display_name || "Player").charAt(0).toUpperCase() || "?"}
            </span>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="board-frame"><Board /></div>

    <div class="side-panel side-panel--dice">
      <div
        class="dice-stack"
        aria-label="Dice"
      >
        {#each dice as color (color)}
          <button
            class="die die--{color}"
            class:die--selected={game?.phase === "turn" &&
              selectedDice.includes(color)}
            class:die--locked={rollResultVisible && selectedDice.includes(color)}
            class:die--inactive={rollResultVisible &&
              !selectedDice.includes(color)}
            type="button"
            aria-label="{color} die"
            aria-pressed={selectedDice.includes(color)}
            disabled={game?.phase !== "turn" || $session.processing.roll}
            onclick={() => toggleDie(color)}
          >
            <span class="die-value">{rolledValueForColor(color) ?? ""}</span>
          </button>
        {/each}
      </div>

      {#if game?.phase === "turn"}
        <button
          class="roll-button"
          type="button"
          aria-label="Roll selected dice"
          disabled={rollDisabled}
          onclick={roll}
        >
          roll
        </button>
      {:else if game?.sum}
        <div
          class="sum-token"
          aria-label="Rolled sum {game.sum}"
        >
          {game.sum}
        </div>
      {/if}

      {#if decisionPending}
        <div
          class="decision-controls"
          aria-label="Roll decision"
        >
          <button
            class="decision-button decision-button--keep"
            type="button"
            aria-label="Keep first roll result"
            disabled={decisionDisabled}
            onclick={keep}
          >
            {#if $session.processing.keep}
              ...
            {:else}
              keep
            {/if}
          </button>

          <button
            class="decision-button decision-button--reroll"
            type="button"
            aria-label="Reroll same dice"
            disabled={decisionDisabled}
            onclick={reroll}
          >
            {#if $session.processing.reroll}
              ...
            {:else}
              reroll
            {/if}
          </button>
        </div>
      {/if}

      {#if actionError}
        <p
          class="action-error"
          aria-live="polite"
        >
          {actionError}
        </p>
      {/if}
    </div>
  </div>
</main>

<style>
  .game {
    display: grid;
    place-items: center;
    overflow: clip;
    width: 100%;
    height: 100vh;
    padding: clamp(0.5rem, 1.8vmin, 1rem);
  }

  @supports (height: 100svh) {
    .game {
      height: 100svh;
    }
  }

  .play-surface {
    display: grid;
    grid-template-columns:
      minmax(3.75rem, 0.16fr)
      minmax(0, 1fr)
      minmax(3.75rem, 0.16fr);
    align-items: stretch;
    gap: clamp(0.5rem, 1.6vmin, 0.85rem);
    width: min(100%, calc((100vh - 2rem) * 2.35), 68rem);
  }

  @supports (height: 100svh) {
    .play-surface {
      width: min(100%, calc((100svh - 2rem) * 2.35), 68rem);
    }
  }

  .board-frame {
    min-width: 0;
  }

  .side-panel {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: clamp(0.35rem, 1.3vmin, 0.65rem);
    min-width: 0;
    padding: clamp(0.4rem, 1.2vmin, 0.65rem);
    margin: 0;
    border: 0.08rem solid #d5d9e1;
    border-radius: 0.65rem;
    background: #f6f7f9;
    list-style: none;
  }

  .participant-slot,
  .die,
  .roll-button,
  .sum-token {
    width: min(100%, 3rem);
    aspect-ratio: 1;
  }

  .participant-slot {
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 0.12rem solid #858585;
    border-radius: 999rem;
    background: #ffffff;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.7),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.1);
  }

  .participant-slot--occupied {
    background: #eef0f4;
  }

  .participant-slot--active {
    border-color: #2f6fed;
    outline: 0.18rem solid rgb(47 111 237 / 0.28);
    outline-offset: 0.1rem;
    background: #ffffff;
    box-shadow:
      0 0 0 0.34rem rgb(47 111 237 / 0.12),
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.7),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.1);
  }

  .participant-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .participant-initial {
    color: #5f636b;
    font-size: clamp(1rem, 2.6vmin, 1.35rem);
    font-weight: 700;
    line-height: 1;
  }

  .dice-stack {
    display: grid;
    justify-items: center;
    gap: inherit;
    width: 100%;
  }

  .die {
    display: grid;
    position: relative;
    place-items: center;
    border: 0.12rem solid transparent;
    border-radius: 0.4rem;
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
    background: #be2121;
  }

  .die--yellow {
    background: #d7b326;
  }

  .die--purple {
    background: #5c437b;
  }

  .die--selected {
    border-color: #ffffff;
    outline: 0.16rem solid #2f6fed;
    outline-offset: 0.1rem;
  }

  .die--locked {
    border-color: #ffffff;
    outline: 0.16rem solid rgb(51 56 64 / 0.24);
    outline-offset: 0.1rem;
  }

  .die--inactive {
    opacity: 0.36;
  }

  .die-value {
    text-shadow: 0 0.08rem 0.1rem rgb(0 0 0 / 0.34);
  }

  .roll-button,
  .sum-token {
    display: grid;
    place-items: center;
  }

  .roll-button {
    padding: 0;
    border: 0.12rem solid #858585;
    border-radius: 999rem;
    background: #ffffff;
    color: #333840;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.72),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.12);
    cursor: pointer;
    font: inherit;
    font-size: clamp(0.55rem, 1.5vmin, 0.72rem);
    font-weight: 700;
    line-height: 1;
  }

  .sum-token {
    border: 0.12rem solid #333840;
    border-radius: 999rem;
    background: #ffffff;
    color: #333840;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.72),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.12);
    font-size: clamp(1rem, 2.6vmin, 1.35rem);
    font-weight: 800;
    line-height: 1;
  }

  .decision-controls {
    display: grid;
    gap: clamp(0.25rem, 0.9vmin, 0.4rem);
    width: 100%;
  }

  .decision-button {
    width: 100%;
    min-height: 1.55rem;
    padding: 0 0.2rem;
    border: 0.1rem solid #858585;
    border-radius: 0.4rem;
    background: #ffffff;
    color: #333840;
    cursor: pointer;
    font: inherit;
    font-size: clamp(0.5rem, 1.25vmin, 0.64rem);
    font-weight: 800;
    line-height: 1;
  }

  .decision-button:disabled {
    cursor: default;
  }

  .decision-button:hover:not(:disabled),
  .roll-button:hover:not(:disabled) {
    background: #eef0f4;
  }

  .decision-button:active:not(:disabled),
  .roll-button:active:not(:disabled) {
    transform: translateY(0.04rem);
  }

  .decision-button:focus-visible,
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
    .game {
      padding: 0.5rem;
    }

    .play-surface {
      grid-template-columns:
        minmax(2.6rem, 0.18fr)
        minmax(0, 1fr)
        minmax(2.6rem, 0.18fr);
      gap: 0.4rem;
    }

    .side-panel {
      padding: 0.35rem;
    }

    .participant-slot,
    .die,
    .roll-button,
    .sum-token {
      width: min(100%, 2.15rem);
    }

    .die {
      border-radius: 0.32rem;
    }

    .decision-button {
      min-height: 1.35rem;
      padding: 0 0.12rem;
    }
  }
</style>
