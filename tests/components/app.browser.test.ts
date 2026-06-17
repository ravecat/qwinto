import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import "~/app.css";
import App from "~/app.svelte";
import { dice, selectedSlot } from "~store/overlay.svelte";
import { visiblePlayerId } from "~store/session.svelte";
import { player, sessionState } from "../fixtures";

const sessionMock = await vi.hoisted(async () => {
  const { createSessionMock } = await import("../mocks/session");
  return createSessionMock();
});

vi.mock("~store/session.svelte", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~store/session.svelte")>();
  const { derived, fromStore, writable } = await import("svelte/store");
  const sessionState = fromStore(sessionMock.session);
  const selectedVisiblePlayerId = writable<string | null>(null);
  const selectedVisiblePlayerState = fromStore(selectedVisiblePlayerId);
  const selectedVisiblePlayerPhase = writable<string | null>(null);
  const selectedVisiblePlayerPhaseState = fromStore(selectedVisiblePlayerPhase);

  const errors = derived(sessionMock.session, ($session) => {
    let error: string | null = null;

    for (const [bucket, actionError] of Object.entries($session.errors)) {
      if (actionError === null) {
        continue;
      }

      error = actionError.reason?.trim() || `${bucket} error`;
      break;
    }

    let timeout: string | null = null;

    for (const [bucket, timedOut] of Object.entries($session.timeouts)) {
      if (timedOut) {
        timeout = `${bucket} timeout`;
        break;
      }
    }

    return { error, timeout };
  });

  return {
    ...actual,
    session: sessionMock.session,
    errors,
    visiblePlayerId: {
      get value() {
        const currentSession = sessionState.current.value;
        const currentPhase = currentSession?.game.phase ?? null;
        const scopedPlayerId =
          selectedVisiblePlayerPhaseState.current === currentPhase
            ? selectedVisiblePlayerState.current
            : null;

        return scopedPlayerId ?? currentSession?.self ?? null;
      },
      set value(playerId: string | null) {
        selectedVisiblePlayerId.set(playerId);
        selectedVisiblePlayerPhase.set(sessionState.current.value?.game.phase ?? null);
      },
    },
  };
});

function slot(row: string, col: number) {
  return document.querySelector(
    `[aria-label="Qwinto game board"] [data-row="${row}"][data-col="${col}"]`,
  );
}

function penalty(index: number) {
  return document.querySelector(`[aria-label="Qwinto game board"] [data-penalty="${index}"]`);
}

function queryDieFace(color: string, value: number) {
  return document.querySelector<HTMLElement>(
    `.side-panel--dice [data-die-color="${color}"] [data-die-value="${value}"]`,
  );
}

function dieFace(color: string, value: number) {
  const element = queryDieFace(color, value);
  expect(element).not.toBeNull();
  return element!;
}

describe("Game", () => {
  beforeEach(() => {
    sessionMock.reset();
    dice.value = [];
    selectedSlot.value = null;
    visiblePlayerId.value = null;
  });

  describe("roll phase", () => {
    test("renders active participant from the cursor", async () => {
      sessionMock.set(sessionState.transient({ game: { phase: "roll", cursor: 1 } }).build());

      const screen = await render(App);

      await expect.element(screen.getByRole("group", { name: "Participants" })).toBeVisible();
      await expect
        .element(screen.getByRole("radio", { name: "Show Alice sheet" }))
        .not.toHaveAttribute("aria-current", "true");
      await expect.element(screen.getByRole("radio", { name: "Show Alice sheet" })).toBeChecked();
      await expect
        .element(screen.getByRole("radio", { name: "Show Bob sheet" }))
        .toHaveAttribute("aria-current", "true");
      await expect.element(screen.getByRole("radio", { name: "Show Bob sheet" })).not.toBeChecked();
    });

    test("defaults visible sheet to self and stores the selected participant id", async () => {
      sessionMock.set(sessionState.transient({ game: { phase: "roll" } }).build());

      const screen = await render(App);
      const aliceSheet = screen.getByRole("radio", { name: "Show Alice sheet" });
      const bobSheet = screen.getByRole("radio", { name: "Show Bob sheet" });

      await expect.element(aliceSheet).toBeChecked();
      await expect.element(bobSheet).not.toBeChecked();
      expect(visiblePlayerId.value).toBe("alice");

      await bobSheet.click();

      await expect.element(aliceSheet).not.toBeChecked();
      await expect.element(bobSheet).toBeChecked();
      expect(visiblePlayerId.value).toBe("bob");
    });

    test("returns the visible sheet to self when the turn context changes", async () => {
      const players = {
        alice: player.build({
          rows: { orange: { 0: 1 }, yellow: {}, purple: {} },
        }),
        bob: player.build({
          rows: { orange: { 0: 9 }, yellow: {}, purple: {} },
        }),
      };

      sessionMock.set(sessionState.transient({ game: { phase: "roll", players } }).build());

      const screen = await render(App);
      const aliceSheet = screen.getByRole("radio", { name: "Show Alice sheet" });
      const bobSheet = screen.getByRole("radio", { name: "Show Bob sheet" });

      await bobSheet.click();

      await expect.element(aliceSheet).not.toBeChecked();
      await expect.element(bobSheet).toBeChecked();
      expect(slot("orange", 0)?.querySelector("[data-slot-value]")?.textContent).toBe("9");
      expect(visiblePlayerId.value).toBe("bob");

      sessionMock.set(
        sessionState.transient({ game: { phase: "write_or_pass", players } }).build(),
      );

      await expect.element(aliceSheet).toBeChecked();
      await expect.element(bobSheet).not.toBeChecked();
      expect(slot("orange", 0)?.querySelector("[data-slot-value]")?.textContent).toBe("1");
      expect(visiblePlayerId.value).toBe("alice");
    });

    test("shows response labels from participant statuses", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              players: {
                alice: player.build({ status: "pending" }),
                bob: player.build({ status: "wrote" }),
              },
            },
          })
          .build(),
      );

      await render(App);

      const aliceSlot = document
        .querySelector<HTMLInputElement>('input[aria-label="Show Alice sheet"]')
        ?.closest(".participant-slot");
      const bobSlot = document
        .querySelector<HTMLInputElement>('input[aria-label="Show Bob sheet"]')
        ?.closest(".participant-slot");
      const aliceLabel = aliceSlot?.querySelector(".participant-status-label");
      const bobLabel = bobSlot?.querySelector(".participant-status-label");

      expect(aliceLabel?.textContent).toBe("TURN");
      expect(aliceLabel?.classList.contains("participant-status-label--waiting")).toBe(true);
      expect(bobLabel?.textContent).toBe("READY");
      expect(bobLabel?.classList.contains("participant-status-label--waiting")).toBe(false);
    });

    test("marks the opened session player with a star instead of the active player", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: { phase: "roll", cursor: 0 },
            session: { self: "bob" },
          })
          .build(),
      );

      const screen = await render(App);
      const aliceSheet = screen.getByRole("radio", { name: "Show Alice sheet" });
      const bobSheet = screen.getByRole("radio", { name: "Show Bob sheet" });
      const aliceSlot = document
        .querySelector<HTMLInputElement>('input[aria-label="Show Alice sheet"]')
        ?.closest(".participant-slot");
      const bobSlot = document
        .querySelector<HTMLInputElement>('input[aria-label="Show Bob sheet"]')
        ?.closest(".participant-slot");
      const stars = document.querySelectorAll<HTMLElement>(".participant-self-star");

      await expect.element(aliceSheet).toHaveAttribute("aria-current", "true");
      await expect.element(bobSheet).not.toHaveAttribute("aria-current", "true");
      await expect.element(bobSheet).toBeChecked();
      expect(stars).toHaveLength(1);
      expect(aliceSlot?.querySelector(".participant-self-star")).toBeNull();
      expect(bobSlot?.classList.contains("participant-slot--self")).toBe(true);
      expect(bobSlot?.querySelector(".participant-self-star")).toBe(stars[0]);
    });

    test("lets the active player choose dice and roll", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: { phase: "roll" },
            permissions: { can_roll: true },
          })
          .build(),
      );

      const screen = await render(App);
      const orangeDie = screen.getByRole("checkbox", { name: "orange die" });
      const yellowDie = screen.getByRole("checkbox", { name: "yellow die" });
      const purpleDie = screen.getByRole("checkbox", { name: "purple die" });
      const rollButton = screen.getByRole("button", {
        name: "Roll selected dice",
      });
      const actionButtons = document.querySelectorAll<HTMLElement>(".action-bar .action-button");

      expect(actionButtons).toHaveLength(1);
      expect(actionButtons[0]?.textContent?.trim()).toBe("Roll");
      expect(getComputedStyle(actionButtons[0]!).backgroundColor).toBe("rgb(92, 67, 123)");
      expect(document.querySelector(".side-panel--dice .action-button")).toBeNull();

      await expect.element(rollButton).toBeDisabled();
      await expect.element(orangeDie).not.toBeChecked();

      await orangeDie.click();
      await yellowDie.click();

      await expect.element(orangeDie).toBeChecked();
      await expect.element(yellowDie).toBeChecked();
      await expect.element(purpleDie).not.toBeChecked();
      await expect.element(rollButton).toBeEnabled();

      await rollButton.click();

      expect(sessionMock.actions.roll).toHaveBeenCalledWith({
        colors: ["orange", "yellow"],
      });
    });

    test("disables dice selection and rolling when permissions deny roll actions", async () => {
      sessionMock.set(sessionState.transient({ game: { phase: "roll" } }).build());

      const screen = await render(App);
      const orangeDie = screen.getByRole("checkbox", { name: "orange die" });

      await expect.element(orangeDie).toBeDisabled();
      await expect
        .element(screen.getByRole("button", { name: "Roll selected dice" }))
        .not.toBeInTheDocument();
      await expect.element(orangeDie).not.toBeChecked();
    });

    test("disables dice selection outside roll when permissions deny it", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 3 },
              sum: 3,
              attempt: 1,
            },
            permissions: { can_see_roll: true },
          })
          .build(),
      );

      const screen = await render(App);
      const orangeDie = screen.getByRole("checkbox", { name: "orange die" });

      await expect.element(orangeDie).toBeDisabled();
      await expect.element(orangeDie).toBeChecked();
    });

    test("preserves local dice choice across roll processing updates", async () => {
      const rollState = sessionState
        .transient({
          game: { phase: "roll" },
          permissions: { can_roll: true },
        })
        .build();
      sessionMock.set(rollState);

      const screen = await render(App);
      const orangeDie = screen.getByRole("checkbox", { name: "orange die" });
      const rollButton = screen.getByRole("button", {
        name: "Roll selected dice",
      });

      await orangeDie.click();

      await expect.element(orangeDie).toBeChecked();

      sessionMock.set({
        ...rollState,
        processing: { ...rollState.processing, roll: true },
      });

      await expect.element(orangeDie).toBeChecked();
      await expect.element(orangeDie).toBeDisabled();
      await expect.element(rollButton).toBeDisabled();
    });

    test("uses server rolled dice after roll and starts the next roll phase empty", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: { phase: "roll", cursor: 0 },
            permissions: { can_roll: true },
          })
          .build(),
      );

      const screen = await render(App);
      const orangeDie = screen.getByRole("checkbox", { name: "orange die" });
      const yellowDie = screen.getByRole("checkbox", { name: "yellow die" });
      const rollButton = screen.getByRole("button", {
        name: "Roll selected dice",
      });

      await orangeDie.click();
      await yellowDie.click();

      await expect.element(orangeDie).toBeChecked();
      await expect.element(yellowDie).toBeChecked();
      await expect.element(rollButton).toBeEnabled();

      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              cursor: 0,
              dices: { orange: 2, yellow: 5 },
              sum: 7,
              attempt: 1,
            },
            permissions: { can_see_roll: true },
          })
          .build(),
      );

      await expect.element(orangeDie).toBeChecked();
      await expect.element(yellowDie).toBeChecked();
      await expect.element(dieFace("orange", 2)).toBeVisible();
      await expect.element(dieFace("yellow", 5)).toBeVisible();
      await expect.element(screen.getByLabelText("Rolled sum 7")).not.toBeInTheDocument();

      sessionMock.set(sessionState.transient({ game: { phase: "roll", cursor: 1 } }).build());

      await expect.element(orangeDie).not.toBeChecked();
      await expect.element(yellowDie).not.toBeChecked();
      await expect
        .element(screen.getByRole("button", { name: "Roll selected dice" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("radio", { name: "Show Bob sheet" }))
        .toHaveAttribute("aria-current", "true");
    });
  });

  describe("write/pass phase", () => {
    test("after first roll shows rolled dice and active response controls", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 4, purple: 5 },
              sum: 9,
              attempt: 1,
            },
            permissions: {
              can_reroll: true,
              can_see_roll: true,
              can_write: true,
              can_penalize: true,
            },
            session: {
              available_slots: [
                { row: "orange", slot: 0 },
                { row: "purple", slot: 8 },
              ],
            },
          })
          .build(),
      );

      const screen = await render(App);
      const orangeDie = screen.getByRole("checkbox", { name: "orange die" });
      const yellowDie = screen.getByRole("checkbox", { name: "yellow die" });
      const purpleDie = screen.getByRole("checkbox", { name: "purple die" });
      const rerollButton = screen.getByRole("button", {
        name: "Reroll same dice",
      });
      const cancelButton = screen.getByRole("button", {
        name: "Take penalty",
      });
      const confirmButton = screen.getByRole("button", {
        name: "Confirm selected cell with result 9",
      });

      await expect.element(screen.getByLabelText("Rolled sum 9")).not.toBeInTheDocument();
      await expect.element(screen.getByText("9")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Roll selected dice" }))
        .not.toBeInTheDocument();
      await expect.element(orangeDie).toBeChecked();
      await expect.element(yellowDie).not.toBeChecked();
      await expect.element(purpleDie).toBeChecked();
      await expect.element(dieFace("orange", 4)).toBeVisible();
      await expect.element(dieFace("purple", 5)).toBeVisible();
      await expect.element(orangeDie).toBeDisabled();
      await expect.element(rerollButton).toBeEnabled();
      await expect.element(cancelButton).toBeEnabled();
      await expect.element(confirmButton).toBeDisabled();
      const orangeRing = slot("orange", 0)?.querySelector("[data-slot-ring]");
      expect(orangeRing).not.toBeNull();
      for (const attribute of ["x", "y", "width", "height"]) {
        expect(orangeRing?.hasAttribute(attribute)).toBe(true);
      }
      expect(slot("purple", 8)?.querySelector("[data-slot-ring]")).not.toBeNull();
      expect(slot("yellow", 0)?.querySelector("[data-slot-ring]")).toBeNull();

      await screen.getByRole("button", { name: "Select orange column 1" }).click();

      await expect.element(confirmButton).toBeEnabled();

      await confirmButton.click();
      await cancelButton.click();
      await rerollButton.click();

      expect(sessionMock.actions.write).toHaveBeenCalledWith({ row: "orange", slot: 0 });
      expect(sessionMock.actions.penalize).toHaveBeenCalledTimes(1);
      expect(sessionMock.actions.reroll).toHaveBeenCalledTimes(1);
    });

    test("lays out the board, side panels, and equal action buttons without gaps", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 4, purple: 5 },
              sum: 9,
              attempt: 1,
            },
            permissions: {
              can_reroll: true,
              can_see_roll: true,
              can_write: true,
              can_penalize: true,
            },
          })
          .build(),
      );

      await render(App);

      const participants = document.querySelector<HTMLElement>(".side-panel--participants");
      const board = document.querySelector<HTMLElement>(".board-frame");
      const dicePanel = document.querySelector<HTMLElement>(".side-panel--dice");
      const actionBar = document.querySelector<HTMLElement>(".action-bar");
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(".action-button"));
      const participantFace = document.querySelector<HTMLElement>(".participant-face");
      const die = queryDieFace("orange", 4);

      expect(participants).not.toBeNull();
      expect(board).not.toBeNull();
      expect(dicePanel).not.toBeNull();
      expect(actionBar).not.toBeNull();
      expect(participantFace).not.toBeNull();
      expect(die).not.toBeNull();
      expect(buttons).toHaveLength(3);

      const participantsRect = participants!.getBoundingClientRect();
      const boardRect = board!.getBoundingClientRect();
      const dicePanelRect = dicePanel!.getBoundingClientRect();
      const actionBarRect = actionBar!.getBoundingClientRect();
      const participantFaceRect = participantFace!.getBoundingClientRect();
      const dieRect = die!.getBoundingClientRect();
      const buttonRects = buttons.map((button) => button.getBoundingClientRect());
      const buttonWidths = buttonRects.map((rect) => rect.width);

      expect(Math.abs(boardRect.left - participantsRect.right)).toBeLessThan(0.5);
      expect(Math.abs(dicePanelRect.left - boardRect.right)).toBeLessThan(0.5);
      expect(Math.abs(actionBarRect.top - participantsRect.bottom)).toBeLessThan(0.5);
      expect(Math.abs(buttonWidths[0] - buttonWidths[1])).toBeLessThan(0.5);
      expect(Math.abs(buttonWidths[1] - buttonWidths[2])).toBeLessThan(0.5);
      expect(Math.abs(buttonRects[1].left - buttonRects[0].right)).toBeLessThan(0.5);
      expect(Math.abs(buttonRects[2].left - buttonRects[1].right)).toBeLessThan(0.5);
      expect(Math.abs(participantFaceRect.width - dieRect.width)).toBeLessThan(0.5);
      expect(Math.abs(participantFaceRect.height - dieRect.height)).toBeLessThan(0.5);
      expect(Math.abs(participantFaceRect.width - participantFaceRect.height)).toBeLessThan(0.5);
      expect(getComputedStyle(buttons[0]!).backgroundColor).toBe("rgb(226, 189, 47)");
      expect(getComputedStyle(buttons[1]!).backgroundColor).toBe("rgb(217, 101, 30)");
      expect(getComputedStyle(buttons[2]!).backgroundColor).toBe("rgb(92, 67, 123)");
      expect(getComputedStyle(actionBar!).gap).toBe("0px");
      expect(getComputedStyle(buttons[0]!).borderRadius).toBe("0px");
    });

    test("hides available slots when the projection has no slots", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 4 },
              sum: 4,
              attempt: 1,
            },
            session: { available_slots: [] },
          })
          .build(),
      );

      await render(App);

      expect(slot("orange", 0)?.querySelector("[data-slot-ring]")).toBeNull();
    });

    test("hides response controls when permissions deny them", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 4 },
              sum: 4,
              attempt: 2,
            },
            permissions: { can_see_roll: true },
          })
          .build(),
      );

      const screen = await render(App);

      await expect.element(dieFace("orange", 4)).toBeVisible();
      await expect.element(screen.getByLabelText("Rolled sum 4")).not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Reroll same dice" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Take penalty" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Confirm selected cell" }))
        .not.toBeInTheDocument();
    });

    test("shows the confirm result when write permission implies roll visibility", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 3, yellow: 5 },
              sum: 8,
              attempt: 1,
            },
            permissions: { can_write: true },
            session: { available_slots: [{ row: "orange", slot: 0 }] },
          })
          .build(),
      );

      const screen = await render(App);
      const confirmButton = screen.getByRole("button", {
        name: "Confirm selected cell with result 8",
      });

      await expect.element(dieFace("orange", 3)).toBeVisible();
      await expect.element(dieFace("yellow", 5)).toBeVisible();
      await expect.element(screen.getByText("8")).toBeVisible();
      await expect.element(confirmButton).toBeDisabled();
      await screen.getByRole("button", { name: "Select orange column 1" }).click();
      await expect.element(confirmButton).toBeEnabled();
    });

    test("toggles the selected slot off when clicked again", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 3, yellow: 5 },
              sum: 8,
              attempt: 1,
            },
            permissions: { can_write: true },
            session: { available_slots: [{ row: "orange", slot: 0 }] },
          })
          .build(),
      );

      const screen = await render(App);
      const slotButton = screen.getByRole("button", { name: "Select orange column 1" });
      const confirmButton = screen.getByRole("button", {
        name: "Confirm selected cell with result 8",
      });

      await expect.element(slotButton).toHaveAttribute("aria-pressed", "false");
      await expect.element(confirmButton).toBeDisabled();

      await slotButton.click();

      expect(selectedSlot.value).toEqual({ row: "orange", slot: 0 });
      await expect.element(slotButton).toHaveAttribute("aria-pressed", "true");
      await expect.element(confirmButton).toBeEnabled();

      await slotButton.click();

      expect(selectedSlot.value).toBeNull();
      await expect.element(slotButton).toHaveAttribute("aria-pressed", "false");
      await expect.element(confirmButton).toBeDisabled();
    });

    test("disables confirm while write is processing", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { yellow: 6 },
              sum: 6,
              attempt: 1,
            },
            permissions: { can_see_roll: true, can_write: true },
            session: { available_slots: [{ row: "yellow", slot: 0 }] },
          })
          .build({
            processing: {
              roll: false,
              reroll: false,
              write: true,
              pass: false,
              penalize: false,
            },
          }),
      );

      const screen = await render(App);

      await screen.getByRole("button", { name: "Select yellow column 1" }).click();

      await expect
        .element(screen.getByRole("button", { name: "Confirm selected cell" }))
        .toBeDisabled();
    });

    test("keeps controls enabled while the session is not ready and action errors are visible", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 3 },
              sum: 3,
              attempt: 1,
            },
            permissions: {
              can_reroll: true,
              can_see_roll: true,
              can_write: true,
              can_penalize: true,
            },
            session: { available_slots: [{ row: "orange", slot: 0 }] },
          })
          .build({
            status: "stale",
            errors: {
              roll: null,
              reroll: { reason: "rejected" },
              write: null,
              pass: null,
              penalize: null,
            },
          }),
      );

      const screen = await render(App);

      await expect.element(screen.getByRole("button", { name: "Reroll same dice" })).toBeEnabled();
      await expect.element(screen.getByRole("button", { name: "Take penalty" })).toBeEnabled();
      await screen.getByRole("button", { name: "Select orange column 1" }).click();
      await expect
        .element(screen.getByRole("button", { name: "Confirm selected cell" }))
        .toBeEnabled();
      await expect.element(screen.getByText("rejected")).toBeVisible();
    });

    test("hides confirmation controls when permissions deny choice actions", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { purple: 2 },
              sum: 2,
              attempt: 1,
            },
            permissions: { can_see_roll: true },
          })
          .build(),
      );

      const screen = await render(App);

      await expect.element(dieFace("purple", 2)).toBeVisible();
      await expect.element(screen.getByLabelText("Rolled sum 2")).not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Reroll same dice" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Take penalty" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Confirm selected cell" }))
        .not.toBeInTheDocument();
    });

    test("hides rolled values and sum when permissions deny visibility", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { orange: 3 },
              sum: 3,
              attempt: 1,
            },
          })
          .build(),
      );

      const screen = await render(App);
      const orangeDie = screen.getByRole("checkbox", { name: "orange die" });

      await expect.element(screen.getByLabelText("Rolled sum 3")).not.toBeInTheDocument();
      expect(queryDieFace("orange", 3)).toBeNull();
      await expect.element(orangeDie).toBeChecked();
    });

    test("shows action error before later errors and timeouts", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { purple: 2 },
              sum: 2,
              attempt: 1,
            },
          })
          .build({
            errors: {
              roll: { reason: "" },
              reroll: null,
              write: { reason: "rejected" },
              pass: null,
              penalize: null,
            },
            timeouts: {
              roll: false,
              reroll: false,
              write: true,
              pass: false,
              penalize: false,
            },
          }),
      );

      const screen = await render(App);

      await expect.element(screen.getByText("roll error")).toBeVisible();
      await expect.element(screen.getByText("rejected")).not.toBeInTheDocument();
      await expect.element(screen.getByText("timeout")).not.toBeInTheDocument();
    });

    test("shows timeout error when no action error is present", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "write_or_pass",
              dices: { yellow: 1 },
              sum: 1,
              attempt: 1,
            },
          })
          .build({
            timeouts: {
              roll: false,
              reroll: true,
              write: true,
              pass: false,
              penalize: false,
            },
          }),
      );

      const screen = await render(App);

      await expect.element(screen.getByText("reroll timeout")).toBeVisible();
      await expect.element(screen.getByText("write timeout")).not.toBeInTheDocument();
    });
  });

  describe("result phase", () => {
    test("renders self score-sheet values in their board slots", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "result",
              players: {
                alice: player.build({
                  rows: {
                    orange: { 0: 3 },
                    yellow: { 2: 6 },
                    purple: { 8: 9 },
                  },
                }),
                bob: player.build(),
              },
            },
          })
          .build(),
      );

      await render(App);

      expect(slot("orange", 0)?.querySelector("[data-slot-value]")?.textContent).toBe("3");
      expect(slot("yellow", 2)?.querySelector("[data-slot-value]")?.textContent).toBe("6");
      expect(slot("purple", 8)?.querySelector("[data-slot-value]")?.textContent).toBe("9");
      expect(slot("orange", 1)?.querySelector("[data-slot-value]")).toBeNull();
    });

    test("renders visible player penalties as penalty cross marks", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "result",
              players: {
                alice: player.build({ penalties: 2 }),
                bob: player.build({ penalties: 3 }),
              },
            },
          })
          .build(),
      );

      const screen = await render(App);

      expect(penalty(0)).not.toBeNull();
      expect(penalty(1)).not.toBeNull();
      expect(penalty(2)).toBeNull();

      await screen.getByRole("radio", { name: "Show Bob sheet" }).click();

      expect(penalty(0)).not.toBeNull();
      expect(penalty(1)).not.toBeNull();
      expect(penalty(2)).not.toBeNull();
      expect(penalty(3)).toBeNull();
    });

    test("uses self instead of guessing from active player rows", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "result",
              cursor: 0,
              players: {
                alice: player.build({
                  rows: {
                    orange: { 0: 4 },
                    yellow: {},
                    purple: {},
                  },
                }),
                bob: player.build({
                  rows: {
                    orange: {},
                    yellow: { 2: 7 },
                    purple: {},
                  },
                }),
              },
            },
            session: {
              self: "bob",
            },
          })
          .build(),
      );

      await render(App);

      expect(slot("orange", 0)?.querySelector("[data-slot-value]")).toBeNull();
      expect(slot("yellow", 2)?.querySelector("[data-slot-value]")?.textContent).toBe("7");
    });

    test("preserves selected own slot while viewing another player sheet", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "result",
              players: {
                alice: player.build({
                  rows: {
                    orange: { 0: 3 },
                    yellow: {},
                    purple: {},
                  },
                }),
                bob: player.build({
                  rows: {
                    orange: {},
                    yellow: { 2: 7 },
                    purple: {},
                  },
                }),
              },
            },
            permissions: { can_write: true },
            session: {
              available_slots: [{ row: "orange", slot: 1 }],
            },
          })
          .build(),
      );

      const screen = await render(App);

      expect(slot("orange", 0)?.querySelector("[data-slot-value]")?.textContent).toBe("3");
      expect(slot("orange", 1)?.querySelector("[data-slot-ring]")).not.toBeNull();

      await screen.getByRole("button", { name: "Select orange column 2" }).click();
      await expect
        .element(screen.getByRole("button", { name: "Confirm selected cell" }))
        .toBeEnabled();

      await screen.getByRole("radio", { name: "Show Bob sheet" }).click();

      expect(slot("orange", 0)?.querySelector("[data-slot-value]")).toBeNull();
      expect(slot("yellow", 2)?.querySelector("[data-slot-value]")?.textContent).toBe("7");
      expect(slot("orange", 1)?.querySelector("[data-slot-ring]")).toBeNull();
      await expect
        .element(screen.getByRole("button", { name: "Confirm selected cell" }))
        .toBeEnabled();

      await screen.getByRole("button", { name: "Confirm selected cell" }).click();

      expect(sessionMock.actions.write).toHaveBeenCalledWith({
        row: "orange",
        slot: 1,
      });
    });

    test("preserves roll details without choice controls", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "result",
              dices: { yellow: 6 },
              sum: 6,
              attempt: 2,
            },
            permissions: { can_see_roll: true },
          })
          .build(),
      );

      const screen = await render(App);

      await expect.element(dieFace("yellow", 6)).toBeVisible();
      await expect.element(screen.getByLabelText("Rolled sum 6")).not.toBeInTheDocument();
      await expect.element(screen.getByRole("checkbox", { name: "yellow die" })).toBeChecked();
      await expect.element(screen.getByRole("checkbox", { name: "orange die" })).not.toBeChecked();
      await expect
        .element(screen.getByRole("button", { name: "Reroll same dice" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Take penalty" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Confirm selected cell" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Pass result" }))
        .not.toBeInTheDocument();
    });

    test("shows selectable slots, confirm, and pass for passive result responses", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "result",
              dices: { orange: 4, purple: 5 },
              sum: 9,
              attempt: 2,
            },
            permissions: { can_see_roll: true, can_write: true, can_pass: true },
            session: {
              available_slots: [
                { row: "orange", slot: 0 },
                { row: "purple", slot: 8 },
              ],
            },
          })
          .build(),
      );

      const screen = await render(App);
      const passButton = screen.getByRole("button", { name: "Pass result" });
      const confirmButton = screen.getByRole("button", {
        name: "Confirm selected cell with result 9",
      });

      await expect.element(passButton).toBeEnabled();
      await expect.element(confirmButton).toBeDisabled();
      expect(slot("orange", 0)?.querySelector("[data-slot-ring]")).not.toBeNull();
      expect(slot("purple", 8)?.querySelector("[data-slot-ring]")).not.toBeNull();
      expect(slot("yellow", 0)?.querySelector("[data-slot-ring]")).toBeNull();

      await screen.getByRole("button", { name: "Select purple column 9" }).click();
      await expect.element(confirmButton).toBeEnabled();

      await passButton.click();
      await confirmButton.click();

      expect(sessionMock.actions.pass).toHaveBeenCalledTimes(1);
      expect(sessionMock.actions.write).toHaveBeenCalledWith({ row: "purple", slot: 8 });
    });

    test("shows pass from the projected permission without local phase or attempt checks", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "result",
              dices: { yellow: 6 },
              sum: 6,
              attempt: 1,
            },
            permissions: { can_see_roll: true, can_pass: true },
          })
          .build(),
      );

      const screen = await render(App);

      await expect.element(screen.getByRole("button", { name: "Pass result" })).toBeEnabled();
    });
  });
});
