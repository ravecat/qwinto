<script lang="ts">
  import { shell } from "@rvct/d20sdk";
  import board from "~assets/board.svg";

  type RuntimeSession = {
    value: unknown;
  };

  const runtime = shell<RuntimeSession>({
    allowedOrigins: import.meta.env.VITE_D20_SHELL_ORIGIN
      ? [import.meta.env.VITE_D20_SHELL_ORIGIN]
      : undefined,
  });
</script>

<main
  class="game"
  data-runtime-status={$runtime.status}
>
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
