<script lang="ts">
  import Board from "./board.svelte";
  import { session } from "./session";

  const activeMemberId = $derived.by(() => {
    const game = $session.value?.game;

    return game?.order[game.cursor] ?? null;
  });
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
        aria-hidden="true"
      >
        <span class="die die--red"></span>
        <span class="die die--yellow"></span>
        <span class="die die--purple"></span>
      </div>

      <button
        class="roll-button"
        type="button"
        aria-label="Roll dice"
      >
        roll
      </button>
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
    aspect-ratio: 659.967 / 370.908;
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
  .roll-button {
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
    border-radius: 0.4rem;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.24),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.22);
  }

  .die--red {
    background: #be2121;
  }

  .die--yellow {
    background: #d7b326;
  }

  .die--purple {
    background: #5c437b;
  }

  .roll-button {
    display: grid;
    place-items: center;
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

  .roll-button:hover:not(:disabled) {
    background: #eef0f4;
  }

  .roll-button:active:not(:disabled) {
    transform: translateY(0.04rem);
  }

  .roll-button:focus-visible {
    outline: 0.16rem solid #2f6fed;
    outline-offset: 0.14rem;
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
    .roll-button {
      width: min(100%, 2.15rem);
    }

    .die {
      border-radius: 0.32rem;
    }
  }
</style>
