<script lang="ts">
  import { selectedSlot } from "~store/overlay.svelte";
  import permissions from "~store/permissions";
  import { session } from "~store/session";

  const game = $derived($session.value?.game ?? null);
  const canWrite = $derived($permissions.can_write);
  const canReroll = $derived($permissions.can_reroll);
  const canPenalize = $derived($permissions.can_penalize);
  const canPass = $derived($permissions.can_pass);
  const hasAvailableActions = $derived(canReroll || canPenalize || canPass || canWrite);

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
        aria-label="Take penalty"
        disabled={$session.processing.penalize}
        onclick={cancel}
      >
        Penalty
      </button>
    {/if}

    {#if canPass}
      <button
        class="action-button action-button--pass"
        type="button"
        aria-label="Pass result"
        disabled={$session.processing.pass}
        onclick={pass}
      >
        Pass
      </button>
    {/if}

    {#if canWrite}
      <button
        class="action-button action-button--confirm"
        type="button"
        aria-label="Confirm selected cell with result {game?.sum}"
        disabled={selectedSlot.value === null || $session.processing.write}
        onclick={confirm}
      >
        Confirm
        <span class="action-button-result">{game?.sum}</span>
      </button>
    {/if}
  </div>
{/if}

<style>
  .action-bar {
    display: grid;
    grid-column: 1 / -1;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: 0;
    width: 100%;
    border-block-start: 0.08rem solid #eef0f4;
    background: #ffffff;
  }

  .action-button {
    --action-button-bg: #ffffff;
    --action-button-color: #333840;
    --action-button-hover-bg: #eef0f4;

    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 2.6rem;
    padding: 0 0.45rem;
    border: 0;
    border-radius: 0;
    background: var(--action-button-bg);
    color: var(--action-button-color);
    cursor: pointer;
    font: inherit;
    font-size: clamp(1.08rem, 2.4vmin, 1.35rem);
    font-weight: 800;
    line-height: 1;
    overflow-wrap: anywhere;
  }

  .action-button--reroll {
    --action-button-bg: var(--game-yellow);
    --action-button-color: #171717;
    --action-button-hover-bg: #d4ad22;
  }

  .action-button--cancel,
  .action-button--pass {
    --action-button-bg: var(--game-orange);
    --action-button-color: #171717;
    --action-button-hover-bg: #c85818;
  }

  .action-button--confirm {
    --action-button-bg: var(--game-purple);
    --action-button-color: #ffffff;
    --action-button-hover-bg: #4f386e;
  }

  .action-button + .action-button {
    border-inline-start: 0.08rem solid var(--surface-border);
  }

  .action-button-result {
    margin-inline-start: 0.35rem;
    font-variant-numeric: tabular-nums;
  }

  .action-button:disabled {
    cursor: default;
    opacity: 0.52;
  }

  .action-button:hover:not(:disabled) {
    background: var(--action-button-hover-bg);
  }

  .action-button:active:not(:disabled) {
    transform: translateY(0.04rem);
  }

  .action-button:focus-visible {
    outline: 0.16rem solid #2f6fed;
    outline-offset: 0.14rem;
  }

  @media (max-width: 640px) {
    .action-button {
      min-height: 2.2rem;
      padding: 0 0.2rem;
      font-size: clamp(0.825rem, 3vmin, 1.08rem);
    }
  }
</style>
