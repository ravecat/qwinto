<script lang="ts">
  import { session, visiblePlayerId } from "~store/session.svelte";

  const game = $derived($session.value?.game ?? null);

  const members = $derived.by(() => {
    const self = $session.value?.self ?? null;

    return Object.entries($session.value?.members ?? {}).map(([id, member], index) => {
      return {
        id,
        label: member.display_name?.trim() || `Player ${index + 1}`,
        avatar: member.avatar,
        active: id === game?.order[game.cursor],
        self: id === self,
        status: game?.players[id]?.status,
      };
    });
  });
</script>

<fieldset class="side-panel side-panel--participants" aria-label="Participants">
  {#each members as member (member.id)}
    <label
      class="participant-slot participant-slot--occupied"
      class:participant-slot--active={member.active}
      class:participant-slot--self={member.self}
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

        {#if member.self}
          <span class="participant-self-star"></span>
        {/if}

        {#if member.status === "pending"}
          <span class="participant-status-label participant-status-label--waiting">
            {member.active ? "TURN" : "READY"}
          </span>
        {:else if member.status === "wrote" || member.status === "skipped"}
          <span class="participant-status-label">READY</span>
        {/if}
      </span>
    </label>
  {/each}
</fieldset>

<style>
  .side-panel {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: clamp(0.35rem, 1.3vmin, 0.65rem);
    min-width: 0;
    padding: clamp(0.4rem, 1.2vmin, 0.65rem);
    margin: 0;
    border: 0;
    border-radius: 0;
    background: #f6f7f9;
    list-style: none;
  }

  .side-panel--participants {
    justify-items: center;
  }

  .participant-slot {
    --participant-slot-offset: 0;

    position: relative;
    display: grid;
    place-items: center;
    width: min(100%, 3rem);
    max-width: min(100%, 5.4rem);
    aspect-ratio: 1;
    align-self: center;
    cursor: pointer;
    transform: translateX(var(--participant-slot-offset));
    transition: transform 160ms ease;
  }

  .participant-slot:has(.participant-radio:checked) {
    --participant-slot-offset: clamp(0.3rem, 1.2vmin, 0.5rem);
  }

  .participant-radio {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    margin: 0;
    cursor: pointer;
    opacity: 0;
  }

  .participant-face {
    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 0.04rem;
    border: 1px solid var(--surface-border);
    background: #ffffff;
    pointer-events: none;
  }

  .participant-slot--occupied .participant-face {
    background: #eef0f4;
  }

  .participant-slot--active .participant-face {
    background: #ffffff;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.7),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.1);
  }

  .participant-radio:focus-visible + .participant-face {
    border-color: var(--game-orange);
    border-width: 0.16rem;
  }

  .participant-self-star {
    grid-area: 1 / 1;
    align-self: start;
    justify-self: start;
    z-index: 1;
    width: clamp(1.05rem, 2.65vmin, 1.45rem);
    aspect-ratio: 1;
    background: var(--game-orange);
    clip-path: polygon(
      50% 0,
      61% 35%,
      98% 35%,
      68% 57%,
      79% 91%,
      50% 70%,
      21% 91%,
      32% 57%,
      2% 35%,
      39% 35%
    );
    filter: drop-shadow(0 0.05rem 0.05rem rgb(0 0 0 / 0.28));
    pointer-events: none;
  }

  .participant-status-label {
    grid-area: 1 / 1;
    align-self: end;
    justify-self: stretch;
    z-index: 2;
    display: grid;
    place-items: center;
    min-height: clamp(0.9rem, 2.25vmin, 1.2rem);
    background: rgb(255 255 255 / 0.94);
    color: #111827;
    font-size: clamp(0.52rem, 1.35vmin, 0.72rem);
    font-weight: 800;
    line-height: 1;
    pointer-events: none;
    white-space: nowrap;
  }

  .participant-status-label--waiting {
    animation: participant-status-label-waiting 1.6s ease-in-out infinite;
  }

  @keyframes participant-status-label-waiting {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0;
    }
  }

  .participant-avatar {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .participant-initial {
    grid-area: 1 / 1;
    color: #5f636b;
    font-size: clamp(1rem, 2.6vmin, 1.35rem);
    font-weight: 700;
    line-height: 1;
  }

  @media (max-width: 640px) {
    .side-panel {
      padding: 0.35rem;
    }

    .participant-slot {
      width: min(100%, 2.15rem);
      max-width: min(100%, 3.4rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .participant-slot {
      transition: none;
    }

    .participant-status-label--waiting {
      animation: none;
      opacity: 1;
    }
  }
</style>
