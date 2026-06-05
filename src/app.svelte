<script lang="ts">
  import { shell } from "@rvct/d20sdk";
  import Board from "./Board.svelte";

  const runtime = shell();
</script>

<main class="game" data-runtime-status={$runtime.status}>
  <Board />
</main>

<style>
  .game {
    width: 100vw;
    height: 100vh;
  }

  @supports (height: 100svh) {
    .game {
      height: 100svh;
    }
  }
</style>
