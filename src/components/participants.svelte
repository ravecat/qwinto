<script lang="ts">
  import { visiblePlayerId } from "~store/overlay.svelte";
  import { session } from "~store/session";

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
      class:participant-slot--awaiting={member.status === "pending"}
      class:participant-slot--ready={member.status === "wrote" || member.status === "skipped"}
    >
      <input
        class="participant-radio"
        type="radio"
        name="visible-player"
        bind:group={visiblePlayerId.value}
        value={member.id}
        aria-label="Show {member.label} sheet"
        aria-describedby={member.self ? `participant-${member.id}-self` : undefined}
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
      </span>

      {#if member.self}
        <span id="participant-{member.id}-self" class="participant-self-description"> You </span>
      {/if}
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
    align-content: stretch;
    grid-auto-rows: minmax(0, 1fr);
    justify-items: center;
  }

  .participant-slot {
    position: relative;
    display: grid;
    place-items: center;
    width: min(100%, 3rem);
    max-width: min(100%, 5.4rem);
    aspect-ratio: 1;
    align-self: center;
    cursor: pointer;
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
    --participant-face-inset: clamp(0.12rem, 0.45vmin, 0.2rem);

    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: var(--participant-face-inset);
    border: 0.12rem solid #858585;
    background: #ffffff;
    pointer-events: none;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.7),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.1);
  }

  .participant-slot--occupied .participant-face {
    background: #eef0f4;
  }

  .participant-slot--active .participant-face {
    border-color: #2f6fed;
    background: #ffffff;
    box-shadow:
      inset 0 0.12rem 0.18rem rgb(255 255 255 / 0.7),
      inset 0 -0.12rem 0.24rem rgb(0 0 0 / 0.1);
  }

  .participant-slot--awaiting .participant-face {
    border-color: #111827;
  }

  .participant-radio:focus-visible + .participant-face {
    outline: 0.16rem solid #111827;
    outline-offset: 0.12rem;
  }

  .participant-self-star {
    position: absolute;
    inset-block-start: clamp(0.12rem, 0.5vmin, 0.22rem);
    inset-inline-start: clamp(0.12rem, 0.5vmin, 0.22rem);
    z-index: 1;
    width: clamp(1.05rem, 2.65vmin, 1.45rem);
    aspect-ratio: 1;
    background: #f5c542;
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

  .participant-slot--awaiting .participant-face::after,
  .participant-slot--ready .participant-face::after {
    position: absolute;
    inset-block-end: var(--participant-face-inset);
    inset-inline: var(--participant-face-inset);
    z-index: 2;
    display: grid;
    place-items: center;
    min-height: clamp(0.9rem, 2.25vmin, 1.2rem);
    box-sizing: border-box;
    padding: 0.16rem 0.24rem;
    border: 0.08rem solid rgb(17 24 39 / 0.22);
    background: rgb(255 255 255 / 0.94);
    color: #111827;
    font-size: clamp(0.52rem, 1.35vmin, 0.72rem);
    font-weight: 800;
    line-height: 1;
    pointer-events: none;
    white-space: nowrap;
  }

  .participant-slot--awaiting .participant-face::after {
    content: "TURN";
  }

  .participant-slot--ready .participant-face::after {
    content: "READY";
  }

  .participant-self-description {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    border: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
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

  @media (max-width: 640px) {
    .side-panel {
      padding: 0.35rem;
    }

    .participant-slot {
      width: min(100%, 2.15rem);
      max-width: min(100%, 3.4rem);
    }
  }
</style>
