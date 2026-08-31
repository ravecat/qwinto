<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import type { Snippet } from "svelte";
  import App from "../src/app.svelte";
  import { dice, selectedSlot } from "../src/store/overlay.svelte";
  import { visiblePlayerId } from "../src/store/session.svelte";
  import type { Permissions, Player, Session } from "../src/types/session";
  import { reset, set } from "./mocks/d20sdk";

  type StoryArgs = {
    session: Session;
  };

  const deniedPermissions = {
    can_start_game: false,
    can_roll: false,
    can_reroll: false,
    can_see_roll: false,
    can_write: false,
    can_pass: false,
    can_penalize: false,
  } satisfies Permissions;

  const emptyAlice: Player = {
    rows: { orange: {}, yellow: {}, purple: {} },
    penalties: 0,
    status: "idle",
  };
  const emptyBob: Player = {
    rows: { orange: {}, yellow: {}, purple: {} },
    penalties: 0,
    status: "idle",
  };
  const alice: Player = {
    rows: {
      orange: { 0: 2, 2: 6, 5: 12 },
      yellow: { 0: 1, 3: 7, 7: 14 },
      purple: { 1: 3, 4: 8, 7: 13 },
    },
    penalties: 1,
    status: "pending",
  };
  const bob: Player = {
    rows: {
      orange: { 1: 4, 4: 10 },
      yellow: { 2: 6, 5: 11 },
      purple: { 0: 2, 3: 7, 8: 15 },
    },
    penalties: 0,
    status: "idle",
  };
  const baseSession: Session = {
    id: "11111111-1111-4111-8111-111111111111",
    self: "alice",
    phase: "in_progress",
    owner_id: "alice",
    members: {
      alice: { display_name: "Alice", avatar: null },
      bob: { display_name: "Bob", avatar: null },
    },
    game: {
      phase: "roll",
      order: ["alice", "bob"],
      cursor: 0,
      players: { alice: emptyAlice, bob: emptyBob },
      dices: {},
      sum: null,
      attempt: 0,
      scores: {},
    },
    permissions: deniedPermissions,
    available_slots: [],
  };

  const { Story } = defineMeta<Snippet<[StoryArgs, StoryContext<StoryArgs>]>, typeof App>({
    title: "Game phases",
    component: App,
    render: appStoryTemplate,
    beforeEach: ({ args }) => {
      selectedSlot.value = null;
      visiblePlayerId.value = null;
      dice.value = [];
      set({
        value: args.session,
        status: "ready",
        error: null,
        processing: {
          start: false,
          roll: false,
          reroll: false,
          write: false,
          pass: false,
          penalize: false,
        },
        errors: {
          start: null,
          roll: null,
          reroll: null,
          write: null,
          pass: null,
          penalize: null,
        },
        timeouts: {
          start: false,
          roll: false,
          reroll: false,
          write: false,
          pass: false,
          penalize: false,
        },
      });

      return () => {
        selectedSlot.value = null;
        visiblePlayerId.value = null;
        reset();
        dice.value = [];
      };
    },
    parameters: {
      layout: "fullscreen",
    },
  });
</script>

{#snippet appStoryTemplate()}
  <App />
{/snippet}

<Story
  name="Waiting for players"
  args={{
    session: {
      ...baseSession,
      phase: "waiting_for_players",
      members: {
        alice: baseSession.members.alice,
      },
      game: {
        ...baseSession.game,
        phase: "setup",
        order: ["alice"],
        players: { alice: emptyAlice },
      },
    },
  }}
  parameters={{
    docs: {
      description: {
        story:
          "The session has one player and remains in setup until Qwinto's minimum of two players is present.",
      },
    },
  }}
/>

<Story
  name="Ready to start"
  args={{
    session: {
      ...baseSession,
      phase: "waiting_for_players",
      game: {
        ...baseSession.game,
        phase: "ready",
      },
      permissions: {
        ...deniedPermissions,
        can_start_game: true,
      },
    },
  }}
  parameters={{
    docs: {
      description: {
        story:
          "Two players are ready. The session owner can start the game before the first player chooses dice.",
      },
    },
  }}
/>

<Story
  name="Choose dice"
  args={{
    session: {
      ...baseSession,
      game: {
        ...baseSession.game,
        players: {
          alice: { ...emptyAlice, status: "pending" },
          bob: emptyBob,
        },
      },
      permissions: {
        ...deniedPermissions,
        can_roll: true,
      },
    },
  }}
  parameters={{
    docs: {
      description: {
        story:
          "The active player chooses one to three colored dice. Orange and yellow are selected and ready to roll.",
      },
    },
  }}
  play={async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "orange die" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "yellow die" }));
  }}
/>

<Story
  name="First roll - choose a cell"
  args={{
    session: {
      ...baseSession,
      game: {
        ...baseSession.game,
        phase: "write_or_pass",
        players: { alice, bob },
        dices: { orange: 4, purple: 5 },
        sum: 9,
        attempt: 1,
      },
      permissions: {
        ...deniedPermissions,
        can_reroll: true,
        can_see_roll: true,
        can_write: true,
        can_penalize: true,
      },
      available_slots: [
        { row: "purple", slot: 5 },
        { row: "purple", slot: 6 },
        { row: "orange", slot: 3 },
        { row: "orange", slot: 4 },
      ],
    },
  }}
  parameters={{
    docs: {
      description: {
        story:
          "Alice rolled orange 4 and purple 5 on her first attempt. The sum 9 fits four cells; she may write it, reroll the same dice, or take a penalty.",
      },
    },
  }}
  play={async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Select orange column 4" }));
  }}
/>

<Story
  name="Second roll - write or pass"
  args={{
    session: {
      ...baseSession,
      self: "bob",
      game: {
        ...baseSession.game,
        phase: "result",
        players: {
          alice: { ...alice, status: "pending" },
          bob: { ...bob, status: "pending" },
        },
        dices: { orange: 4, purple: 5 },
        sum: 9,
        attempt: 2,
      },
      permissions: {
        ...deniedPermissions,
        can_see_roll: true,
        can_write: true,
        can_pass: true,
      },
      available_slots: [
        { row: "purple", slot: 4 },
        { row: "purple", slot: 5 },
        { row: "purple", slot: 6 },
        { row: "purple", slot: 7 },
        { row: "orange", slot: 2 },
        { row: "orange", slot: 3 },
      ],
    },
  }}
  parameters={{
    docs: {
      description: {
        story:
          "Alice rerolled the same dice. The second result is final, so Bob may write 9 in one legal orange or purple cell, or pass without a penalty.",
      },
    },
  }}
  play={async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Select purple column 5" }));
  }}
/>

<Story
  name="Finished - final scores"
  args={{
    session: {
      ...baseSession,
      phase: "finished",
      game: {
        ...baseSession.game,
        phase: "finished",
        cursor: 1,
        players: {
          alice: {
            rows: {
              orange: { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9 },
              yellow: { 0: 2, 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9 },
              purple: { 0: 2, 1: 4, 2: 6, 3: 8, 4: 10, 5: 12, 6: 14, 7: 16 },
            },
            penalties: 1,
            status: "skipped",
          },
          bob: {
            rows: {
              orange: { 0: 3, 3: 8, 6: 13 },
              yellow: { 1: 5, 4: 9, 7: 14 },
              purple: { 0: 2, 5: 10, 8: 16 },
            },
            penalties: 4,
            status: "skipped",
          },
        },
        scores: {
          alice: {
            player_id: "alice",
            rows: { orange: 9, yellow: 8, purple: 8 },
            bonuses: 21,
            penalties: -5,
            total: 41,
          },
          bob: {
            player_id: "bob",
            rows: { orange: 3, yellow: 3, purple: 3 },
            bonuses: 16,
            penalties: -20,
            total: 5,
          },
        },
      },
    },
  }}
  parameters={{
    docs: {
      description: {
        story:
          "The game ended when Bob recorded a fourth penalty. Final row, bonus, and penalty scores are shown in descending total order.",
      },
    },
  }}
/>
