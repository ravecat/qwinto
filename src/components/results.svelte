<script lang="ts">
  import { session } from "~store/session.svelte";

  const projection = $derived($session.value);
  const finished = $derived(
    projection?.phase === "finished" || projection?.game.phase === "finished",
  );
  const results = $derived.by(() => {
    if (!projection) return [];

    return Object.entries(projection.game.scores)
      .map(([id, score]) => ({
        id,
        label: projection.members[id]?.display_name?.trim() || id,
        score,
        self: id === projection.self,
        order: projection.game.order.indexOf(id),
      }))
      .sort((left, right) => right.score.total - left.score.total || left.order - right.order);
  });
  const winningScore = $derived(results[0]?.score.total ?? null);

  let dialog = $state<HTMLDialogElement>();
  let resultsOpen = $state(true);

  function showResultsDialog(node: HTMLDialogElement) {
    resultsOpen = true;
    if (!node.open) node.showModal();
  }

  function showResults() {
    resultsOpen = true;
    dialog?.showModal();
  }

  function hideResults() {
    dialog?.close();
  }

  function dismiss(event: MouseEvent) {
    const node = event.currentTarget as HTMLDialogElement;
    if (event.target !== node) return;

    const { top, right, bottom, left } = node.getBoundingClientRect();
    const insideDialog =
      left <= event.clientX &&
      event.clientX <= right &&
      top <= event.clientY &&
      event.clientY <= bottom;

    if (!insideDialog) node.close();
  }
</script>

{#if finished}
  <dialog
    bind:this={dialog}
    class="game-results"
    aria-labelledby="game-results-title"
    aria-live="polite"
    closedby="any"
    use:showResultsDialog
    onclick={dismiss}
    onclose={() => (resultsOpen = false)}
  >
    <header class="game-results__header">
      <div>
        <p class="game-results__eyebrow">Final scores</p>
        <h1 id="game-results-title" class="game-results__title">Game complete</h1>
      </div>

      <button
        class="game-results__close"
        type="button"
        aria-label="Hide results"
        onclick={hideResults}
      >
        <span aria-hidden="true">×</span>
      </button>
    </header>

    {#if results.length > 0}
      <ol class="game-results__players" aria-label="Final scores">
        {#each results as result, index (result.id)}
          <li
            class="game-results__player"
            class:game-results__player--winner={result.score.total === winningScore}
          >
            <div class="game-results__summary">
              <span class="game-results__rank" aria-hidden="true">{index + 1}</span>
              <span class="game-results__name">
                {result.label}
                {#if result.self}<span class="game-results__self">(you)</span>{/if}
                {#if result.score.total === winningScore}
                  <span class="game-results__winner">Winner</span>
                {/if}
              </span>
              <strong class="game-results__total">{result.score.total} points</strong>
            </div>

            <dl class="game-results__breakdown" aria-label="{result.label} score breakdown">
              <div class="game-results__breakdown-item game-results__breakdown-item--orange">
                <dt>Orange</dt>
                <dd>{result.score.rows.orange}</dd>
              </div>
              <div class="game-results__breakdown-item game-results__breakdown-item--yellow">
                <dt>Yellow</dt>
                <dd>{result.score.rows.yellow}</dd>
              </div>
              <div class="game-results__breakdown-item game-results__breakdown-item--purple">
                <dt>Purple</dt>
                <dd>{result.score.rows.purple}</dd>
              </div>
              <div class="game-results__breakdown-item">
                <dt>Bonuses</dt>
                <dd>{result.score.bonuses}</dd>
              </div>
              <div class="game-results__breakdown-item">
                <dt>Penalties</dt>
                <dd>{result.score.penalties}</dd>
              </div>
            </dl>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="game-results__unavailable" role="status">Final results are unavailable.</p>
    {/if}

    <p class="game-results__footer">The highest total wins.</p>
  </dialog>

  <button class="game-results-toggle" type="button" hidden={resultsOpen} onclick={showResults}>
    Results
  </button>
{/if}

<style>
  .game-results::backdrop {
    background: rgb(23 23 23 / 0.72);
    backdrop-filter: blur(0.16rem) saturate(0.72);
  }

  .game-results {
    width: min(42rem, calc(100% - 1.5rem));
    max-width: none;
    max-height: calc(100dvh - 1.5rem);
    overflow: auto;
    overscroll-behavior: contain;
    padding: clamp(0.8rem, 2.5vmin, 1.25rem);
    border: 0.16rem solid #333840;
    border-radius: 0.75rem;
    margin: auto;
    background: #f6f7f9;
    box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 0.38);
    color: #171717;
  }

  .game-results[open] {
    display: grid;
    gap: 1rem;
  }

  .game-results__header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 1rem;
  }

  .game-results__eyebrow,
  .game-results__title,
  .game-results__footer,
  .game-results__unavailable {
    margin: 0;
  }

  .game-results__eyebrow {
    color: #5f636b;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .game-results__title {
    margin-block-start: 0.15rem;
    font-size: clamp(1.5rem, 5vmin, 2.2rem);
    line-height: 1;
  }

  .game-results__close {
    display: grid;
    width: 2.5rem;
    aspect-ratio: 1;
    place-items: center;
    padding: 0;
    border: 0.1rem solid var(--surface-border);
    border-radius: 50%;
    background: #ffffff;
    color: #333840;
    cursor: pointer;
    font: inherit;
    font-size: 1.5rem;
    line-height: 1;
  }

  .game-results__close:hover {
    background: #eef0f4;
  }

  .game-results__close:focus-visible,
  .game-results-toggle:focus-visible {
    outline: 0.16rem solid #2f6fed;
    outline-offset: 0.14rem;
  }

  .game-results__players {
    display: grid;
    gap: 0.65rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .game-results__player {
    display: grid;
    gap: 0.7rem;
    padding: 0.85rem;
    border: 0.1rem solid var(--surface-border);
    border-inline-start: 0.35rem solid #8c929d;
    border-radius: 0.55rem;
    background: #ffffff;
  }

  .game-results__player--winner {
    border-inline-start-color: var(--game-orange);
    background: #fff8f1;
  }

  .game-results__summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.65rem;
  }

  .game-results__rank {
    display: grid;
    width: 1.8rem;
    aspect-ratio: 1;
    place-items: center;
    border-radius: 50%;
    background: #333840;
    color: #ffffff;
    font-weight: 800;
  }

  .game-results__name {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 800;
  }

  .game-results__self {
    color: #5f636b;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .game-results__winner {
    display: inline-block;
    margin-inline-start: 0.45rem;
    padding: 0.16rem 0.38rem;
    border-radius: 999px;
    background: var(--game-orange);
    color: #171717;
    font-size: 0.66rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .game-results__total {
    color: var(--game-purple);
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .game-results__breakdown {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.35rem;
    margin: 0;
  }

  .game-results__breakdown-item {
    display: grid;
    gap: 0.18rem;
    min-width: 0;
    padding: 0.38rem;
    border-block-start: 0.2rem solid #8c929d;
    background: #f6f7f9;
    text-align: center;
  }

  .game-results__breakdown-item--orange {
    border-block-start-color: var(--game-orange);
  }

  .game-results__breakdown-item--yellow {
    border-block-start-color: var(--game-yellow);
  }

  .game-results__breakdown-item--purple {
    border-block-start-color: var(--game-purple);
  }

  .game-results__breakdown dt {
    overflow: hidden;
    color: #5f636b;
    font-size: 0.62rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .game-results__breakdown dd {
    margin: 0;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    font-weight: 800;
  }

  .game-results__unavailable {
    padding: 1rem;
    border: 0.1rem solid var(--surface-border);
    background: #ffffff;
    color: #5f636b;
    text-align: center;
  }

  .game-results__footer {
    color: #5f636b;
    font-size: 0.72rem;
    font-weight: 700;
    text-align: center;
  }

  .game-results-toggle {
    position: fixed;
    z-index: 20;
    inset-block-end: max(1rem, env(safe-area-inset-bottom));
    inset-inline-start: 50%;
    transform: translateX(-50%);
    padding: 0.6rem 0.9rem;
    border: 0.14rem solid var(--game-purple);
    border-radius: 0.5rem;
    background: #ffffff;
    box-shadow: 0 0.65rem 1.8rem rgb(0 0 0 / 0.22);
    color: #171717;
    cursor: pointer;
    font: inherit;
    font-weight: 800;
  }

  @media (max-width: 640px) {
    .game-results {
      width: calc(100% - 0.75rem);
      max-height: calc(100dvh - 0.75rem);
      padding: 0.7rem;
    }

    .game-results[open] {
      gap: 0.7rem;
    }

    .game-results__player {
      gap: 0.55rem;
      padding: 0.65rem;
    }

    .game-results__summary {
      gap: 0.45rem;
    }

    .game-results__total {
      font-size: 1rem;
    }

    .game-results__breakdown {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (forced-colors: active) {
    .game-results,
    .game-results__player,
    .game-results__breakdown-item,
    .game-results__unavailable {
      border: 1px solid CanvasText;
    }
  }
</style>
