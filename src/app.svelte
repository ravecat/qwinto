<script lang="ts">
  import Actions from "~components/actions.svelte";
  import Board from "~components/board.svelte";
  import Dice from "~components/dice.svelte";
  import Participants from "~components/participants.svelte";
</script>

<main class="game">
  <div class="play-surface">
    <Participants />

    <div class="board-frame">
      <Board />
    </div>

    <Dice />
    <Actions />
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
    width: min(100%, calc((100vh - 2rem) * 2.35), 68rem);
    border: 0.08rem solid var(--surface-border);
    border-radius: 0;
    background: #ffffff;
  }

  @supports (height: 100svh) {
    .play-surface {
      width: min(100%, calc((100svh - 2rem) * 2.35), 68rem);
    }
  }

  .board-frame {
    min-width: 0;
    border-inline-start: 0.08rem solid var(--surface-border);
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
    }
  }
</style>
