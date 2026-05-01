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
    display: grid;
    min-height: 100vh;
    align-items: safe center;
    justify-items: center;
    margin: 0;
    padding: 0;
  }

  .game__board {
    display: block;
    width: 100%;
    height: auto;
    margin: 0;
  }
</style>
