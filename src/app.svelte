<script lang="ts">
  import Board from "~components/board.svelte";
  import permissions from "~store/permissions";
  import { selectedSlot, visiblePlayerId } from "~store/overlay.svelte";
  import { actionErrorMessage, type DieColor, session, timeoutErrorMessage } from "~store/session";

  const game = $derived($session.value?.game ?? null);

  let dice = $derived(Object.keys(game?.dices ?? {}) as DieColor[]);

  const members = $derived.by(() => {
    return Object.entries($session.value?.members ?? {}).map(([id, member], index) => {
      return {
        id,
        label: member.display_name?.trim() || `Player ${index + 1}`,
        avatar: member.avatar,
        active: id === game?.order[game.cursor],
      };
    });
  });

  const canSeeRoll = $derived($permissions.can_see_roll && Boolean(game?.sum));
  const canRoll = $derived($permissions.can_roll && !$session.processing.roll);
  const canWrite = $derived($permissions.can_write);
  const canReroll = $derived($permissions.can_reroll);
  const canPenalize = $derived($permissions.can_penalize);
  const canPass = $derived($permissions.can_pass);
  const hasAvailableActions = $derived(canReroll || canPenalize || canWrite || canPass);

  const actionError = $derived(actionErrorMessage($session));
  const timeoutError = $derived(timeoutErrorMessage($session));

  function roll() {
    session.roll({ colors: dice });
  }

  function reroll() {
    session.reroll();
  }

  function confirm() {
    session.write(selectedSlot.value!);
  }

  function cancel() {
    session.penalize();
  }

  function pass() {
    session.pass();
  }
</script>

<main class="game">
  <div class="play-surface">
    <fieldset class="side-panel side-panel--participants" aria-label="Participants">
      {#each members as member (member.id)}
        <label
          class="participant-slot participant-slot--occupied"
          class:participant-slot--active={member.active}
        >
          <input
            class="participant-radio"
            type="radio"
            name="visible-player"
            bind:group={visiblePlayerId.value}
            value={member.id}
            aria-label="Show {member.label} sheet"
            aria-current={member.active ? "true" : undefined}
          />

          <span class="participant-face" aria-hidden="true">
            {#if member.avatar}
              <img
                class="participant-avatar"
                src={member.avatar}
                alt=""
                loading="eager"
                decoding="async"
                referrerpolicy="no-referrer"
              />
            {:else}
              <span class="participant-initial" aria-hidden="true">
                {member.label.charAt(0).toUpperCase()}
              </span>
            {/if}
          </span>
        </label>
      {/each}
    </fieldset>

    <div class="board-frame">
      <Board />
    </div>

    <div class="side-panel side-panel--dice">
      <fieldset
        class="dice-stack"
        class:dice-stack--can-roll={canRoll}
        class:dice-stack--can-see-roll={canSeeRoll}
        disabled={!canRoll}
        aria-label="Dice"
      >
        {#each ["orange", "yellow", "purple"] as const satisfies readonly DieColor[] as color (color)}
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
      {:else if canSeeRoll}
        <div class="sum-token" aria-label="Rolled sum {game?.sum}">
          {game?.sum}
        </div>
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

    {#if hasAvailableActions}
      <div class="action-bar" aria-label="Result actions">
        {#if canReroll}
          <button
            class="action-button action-button--reroll"
            type="button"
            aria-label="Reroll same dice"
            disabled={$session.processing.reroll}
            onclick={reroll}
          >
            Reroll
          </button>
        {/if}

        {#if canPenalize}
          <button
            class="action-button action-button--cancel"
            type="button"
            aria-label="Cancel roll and take penalty"
            disabled={$session.processing.penalize}
            onclick={cancel}
          >
            Cancel
          </button>
        {:else if canPass}
          <button
            class="action-button action-button--pass"
            type="button"
            aria-label="Pass result"
            disabled={$session.processing.pass}
            onclick={pass}
          >
            pass
          </button>
        {/if}

        {#if canWrite}
          <button
            class="action-button action-button--confirm"
            type="button"
            aria-label="Confirm selected cell"
            disabled={selectedSlot.value === null || $session.processing.write}
            onclick={confirm}
          >
            Confirm
          </button>
        {/if}
      </div>
    {/if}
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
    grid-template-rows: minmax(0, auto) auto;
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
  .die-option,
  .roll-button,
  .sum-token {
    width: min(100%, 3rem);
    aspect-ratio: 1;
  }

  .participant-slot {
    position: relative;
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  .participant-radio {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 999rem;
    margin: 0;
    cursor: pointer;
    opacity: 0;
  }

  .participant-face {
    display: grid;
    place-items: center;
    overflow: hidden;
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 0.12rem solid #858585;
    border-radius: 999rem;
    background: #ffffff;
    pointer-events: none;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.7),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.1);
  }

  .participant-slot--occupied .participant-face {
    background: #eef0f4;
  }

  .participant-slot--active .participant-face {
    border-color: #2f6fed;
    outline: 0.18rem solid rgb(47 111 237 / 0.28);
    outline-offset: 0.1rem;
    background: #ffffff;
    box-shadow:
      0 0 0 0.34rem rgb(47 111 237 / 0.12),
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.7),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.1);
  }

  .participant-slot:not(.participant-slot--active) .participant-radio:checked + .participant-face {
    border-color: #111827;
    outline: 0.16rem solid rgb(17 24 39 / 0.18);
    outline-offset: 0.08rem;
  }

  .participant-radio:focus-visible + .participant-face {
    outline: 0.16rem solid #111827;
    outline-offset: -0.24rem;
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
    border-radius: 0.4rem;
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
    background: #d9651e;
  }

  .die--yellow {
    background: #e2bd2f;
  }

  .die--purple {
    background: #5c437b;
  }

  .dice-stack--can-roll .die:checked {
    border-color: #ffffff;
    outline: 0.16rem solid #2f6fed;
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
    outline: 0.16rem solid #2f6fed;
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

  .action-bar {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(0.5rem, 1.6vmin, 0.85rem);
    border-block-start: 0.08rem solid #eef0f4;
    width: 100%;
  }

  .action-button {
    width: 100%;
    min-height: 2.6rem;
    padding: 0 0.45rem;
    border: 0.1rem solid #858585;
    border-radius: 0.4rem;
    background: #ffffff;
    color: #333840;
    cursor: pointer;
    font: inherit;
    font-size: clamp(0.72rem, 1.6vmin, 0.9rem);
    font-weight: 800;
    line-height: 1;
  }

  .action-button--reroll {
    grid-column: 1;
  }

  .action-button--cancel,
  .action-button--pass {
    grid-column: 2;
  }

  .action-button--confirm {
    grid-column: 3;
  }

  .action-button:disabled {
    cursor: default;
  }

  .action-button:hover:not(:disabled),
  .roll-button:hover:not(:disabled) {
    background: #eef0f4;
  }

  .action-button:active:not(:disabled),
  .roll-button:active:not(:disabled) {
    transform: translateY(0.04rem);
  }

  .action-button:focus-visible,
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
    .die-option,
    .roll-button,
    .sum-token {
      width: min(100%, 2.15rem);
    }

    .die {
      border-radius: 0.32rem;
    }

    .action-bar {
      gap: 0.4rem;
    }

    .action-button {
      min-height: 2.2rem;
      padding: 0 0.25rem;
      font-size: clamp(0.62rem, 2.4vmin, 0.78rem);
    }
  }
</style>
