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
    padding: 0;
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
    width: 100%;
    border-radius: 0;
    background: #ffffff;
  }

  .board-frame {
    min-width: 0;
  }

  @media (max-width: 640px) {
    .play-surface {
      grid-template-columns:
        minmax(2.6rem, 0.18fr)
        minmax(0, 1fr)
        minmax(2.6rem, 0.18fr);
    }
  }
</style>
