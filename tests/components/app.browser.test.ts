import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import App from "~/app.svelte";
import { clearSelectedSlot } from "~store/overlay.svelte";
import { sessionState } from "../fixtures";

const sessionMock = await vi.hoisted(async () => {
  const { createSessionMock } = await import("../mocks/session");
  return createSessionMock();
});

vi.mock("~store/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~store/session")>();

  return {
    ...actual,
    session: sessionMock.session,
  };
});

function boardCell(row: string, slot: number) {
  return document.querySelector(
    `[aria-label="Qwinto game board"] [data-row="${row}"][data-slot="${slot}"]`,
  );
}

function boardCellRing(row: string, slot: number) {
  const ring = boardCell(row, slot)?.firstElementChild;
  return ring?.tagName.toLowerCase() === "rect" ? ring : null;
}

describe("Game", () => {
  beforeEach(() => {
    sessionMock.reset();
    clearSelectedSlot();
  });

  describe("roll phase", () => {
    test("renders active participant from the cursor", async () => {
      sessionMock.set(sessionState.transient({ game: { phase: "roll", cursor: 1 } }).build());

      const screen = await render(App);

      await expect.element(screen.getByRole("list", { name: "Participants" })).toBeVisible();
      await expect
        .element(screen.getByRole("listitem", { name: "Alice" }))
        .not.toHaveAttribute("aria-current", "true");
      await expect
        .element(screen.getByRole("listitem", { name: "Bob" }))
        .toHaveAttribute("aria-current", "true");
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
      const rollButton = screen.getByRole("button", {
        name: "Roll selected dice",
      });

      await expect.element(orangeDie).toBeDisabled();
      await expect.element(rollButton).toBeDisabled();
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

      await orangeDie.click();

      await expect.element(orangeDie).toBeChecked();

      sessionMock.set({
        ...rollState,
        processing: { ...rollState.processing, roll: true },
      });

      await expect.element(orangeDie).toBeChecked();
      await expect.element(orangeDie).toBeDisabled();
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
      await expect.element(screen.getByLabelText("Rolled sum 7")).toBeVisible();

      sessionMock.set(sessionState.transient({ game: { phase: "roll", cursor: 1 } }).build());

      await expect.element(orangeDie).not.toBeChecked();
      await expect.element(yellowDie).not.toBeChecked();
      await expect.element(rollButton).toBeDisabled();
      await expect
        .element(screen.getByRole("listitem", { name: "Bob" }))
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
        name: "Cancel roll and take penalty",
      });
      const confirmButton = screen.getByRole("button", {
        name: "Confirm selected cell",
      });

      await expect.element(screen.getByLabelText("Rolled sum 9")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Roll selected dice" }))
        .not.toBeInTheDocument();
      await expect.element(orangeDie).toBeChecked();
      await expect.element(yellowDie).not.toBeChecked();
      await expect.element(purpleDie).toBeChecked();
      await expect.element(screen.getByText("4")).toBeVisible();
      await expect.element(screen.getByText("5")).toBeVisible();
      await expect.element(orangeDie).toBeDisabled();
      await expect.element(rerollButton).toBeEnabled();
      await expect.element(cancelButton).toBeEnabled();
      await expect.element(confirmButton).toBeDisabled();
      const orangeRing = boardCellRing("orange", 0);
      expect(orangeRing).not.toBeNull();
      for (const attribute of ["x", "y", "width", "height"]) {
        expect(orangeRing?.hasAttribute(attribute)).toBe(true);
      }
      expect(boardCellRing("purple", 8)).not.toBeNull();
      expect(boardCellRing("yellow", 0)).toBeNull();

      await screen.getByRole("button", { name: "Select orange slot 1" }).click();

      await expect.element(confirmButton).toBeEnabled();

      await confirmButton.click();
      await cancelButton.click();
      await rerollButton.click();

      expect(sessionMock.actions.write).toHaveBeenCalledWith({ row: "orange", slot: 0 });
      expect(sessionMock.actions.penalize).toHaveBeenCalledTimes(1);
      expect(sessionMock.actions.reroll).toHaveBeenCalledTimes(1);
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

      expect(boardCellRing("orange", 0)).toBeNull();
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

      await expect.element(screen.getByLabelText("Rolled sum 4")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Reroll same dice" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Cancel roll and take penalty" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Confirm selected cell" }))
        .not.toBeInTheDocument();
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

      await screen.getByRole("button", { name: "Select yellow slot 1" }).click();

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
      await expect
        .element(screen.getByRole("button", { name: "Cancel roll and take penalty" }))
        .toBeEnabled();
      await screen.getByRole("button", { name: "Select orange slot 1" }).click();
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

      await expect.element(screen.getByLabelText("Rolled sum 2")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Reroll same dice" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Cancel roll and take penalty" }))
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
      await expect.element(screen.getByText("3")).not.toBeInTheDocument();
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

      await expect.element(screen.getByLabelText("Rolled sum 6")).toBeVisible();
      await expect.element(screen.getByRole("checkbox", { name: "yellow die" })).toBeChecked();
      await expect.element(screen.getByRole("checkbox", { name: "orange die" })).not.toBeChecked();
      await expect
        .element(screen.getByRole("button", { name: "Reroll same dice" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Cancel roll and take penalty" }))
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
      const confirmButton = screen.getByRole("button", { name: "Confirm selected cell" });

      await expect.element(passButton).toBeEnabled();
      await expect.element(confirmButton).toBeDisabled();
      expect(boardCellRing("orange", 0)).not.toBeNull();
      expect(boardCellRing("purple", 8)).not.toBeNull();
      expect(boardCellRing("yellow", 0)).toBeNull();

      await screen.getByRole("button", { name: "Select purple slot 9" }).click();
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
