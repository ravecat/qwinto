<script lang="ts">
  import board from "~assets/board.svg";
</script>

<main class="game">
  <img
    class="game__board"
    src={board}
    alt="Qwinto game board"
  >
</main>

<style>
  .game {
    width: 100vw;
    height: 100vh;
  }

  .game__board {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @supports (height: 100svh) {
    .game {
      height: 100svh;
    }
  }
</style>
