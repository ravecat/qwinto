import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import App from "~/app.svelte";
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

describe("Game", () => {
  beforeEach(() => {
    sessionMock.reset();
  });

  describe("turn phase", () => {
    test("renders active participant from the cursor", async () => {
      sessionMock.set(sessionState.transient({ game: { phase: "turn", cursor: 1 } }).build());

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
      sessionMock.set(sessionState.transient({ game: { phase: "turn" } }).build());

      const screen = await render(App);
      const orangeDie = screen.getByRole("button", { name: "orange die" });
      const yellowDie = screen.getByRole("button", { name: "yellow die" });
      const purpleDie = screen.getByRole("button", { name: "purple die" });
      const rollButton = screen.getByRole("button", {
        name: "Roll selected dice",
      });

      await expect.element(rollButton).toBeDisabled();
      await expect.element(orangeDie).toHaveAttribute("aria-pressed", "false");

      await orangeDie.click();
      await yellowDie.click();

      await expect.element(orangeDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(yellowDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(purpleDie).toHaveAttribute("aria-pressed", "false");
      await expect.element(rollButton).toBeEnabled();

      await rollButton.click();

      expect(sessionMock.actions.roll).toHaveBeenCalledWith({
        colors: ["orange", "yellow"],
      });
    });

    test("preserves local dice choice across turn processing updates", async () => {
      const turnState = sessionState.transient({ game: { phase: "turn" } }).build();
      sessionMock.set(turnState);

      const screen = await render(App);
      const orangeDie = screen.getByRole("button", { name: "orange die" });

      await orangeDie.click();

      await expect.element(orangeDie).toHaveAttribute("aria-pressed", "true");

      sessionMock.set({
        ...turnState,
        processing: { ...turnState.processing, roll: true },
      });

      await expect.element(orangeDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(orangeDie).toBeDisabled();
    });

    test("uses server rolled dice after roll and starts the next turn empty", async () => {
      sessionMock.set(sessionState.transient({ game: { phase: "turn", cursor: 0 } }).build());

      const screen = await render(App);
      const orangeDie = screen.getByRole("button", { name: "orange die" });
      const yellowDie = screen.getByRole("button", { name: "yellow die" });
      const rollButton = screen.getByRole("button", {
        name: "Roll selected dice",
      });

      await orangeDie.click();
      await yellowDie.click();

      await expect.element(orangeDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(yellowDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(rollButton).toBeEnabled();

      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "decision",
              cursor: 0,
              dices: ["orange", "yellow"],
              values: [2, 5],
              sum: 7,
              attempt: 1,
            },
          })
          .build(),
      );

      await expect.element(orangeDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(yellowDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(screen.getByLabelText("Rolled sum 7")).toBeVisible();

      sessionMock.set(sessionState.transient({ game: { phase: "turn", cursor: 1 } }).build());

      await expect.element(orangeDie).toHaveAttribute("aria-pressed", "false");
      await expect.element(yellowDie).toHaveAttribute("aria-pressed", "false");
      await expect.element(rollButton).toBeDisabled();
      await expect
        .element(screen.getByRole("listitem", { name: "Bob" }))
        .toHaveAttribute("aria-current", "true");
    });
  });

  describe("decision phase", () => {
    test("after first roll shows rolled dice and confirmation controls", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "decision",
              dices: ["orange", "purple"],
              values: [4, 5],
              sum: 9,
              attempt: 1,
            },
          })
          .build(),
      );

      const screen = await render(App);
      const orangeDie = screen.getByRole("button", { name: "orange die" });
      const yellowDie = screen.getByRole("button", { name: "yellow die" });
      const purpleDie = screen.getByRole("button", { name: "purple die" });
      const keepButton = screen.getByRole("button", {
        name: "Keep first roll result",
      });
      const rerollButton = screen.getByRole("button", {
        name: "Reroll same dice",
      });

      await expect.element(screen.getByLabelText("Rolled sum 9")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Roll selected dice" }))
        .not.toBeInTheDocument();
      await expect.element(orangeDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(yellowDie).toHaveAttribute("aria-pressed", "false");
      await expect.element(purpleDie).toHaveAttribute("aria-pressed", "true");
      await expect.element(orangeDie).toHaveTextContent("4");
      await expect.element(purpleDie).toHaveTextContent("5");
      await expect.element(orangeDie).toBeDisabled();
      await expect.element(keepButton).toBeEnabled();
      await expect.element(rerollButton).toBeEnabled();

      await keepButton.click();
      await rerollButton.click();

      expect(sessionMock.actions.keep).toHaveBeenCalledTimes(1);
      expect(sessionMock.actions.reroll).toHaveBeenCalledTimes(1);
    });

    test("disables both confirmation actions while one is processing", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "decision",
              dices: ["yellow"],
              values: [6],
              sum: 6,
              attempt: 1,
            },
          })
          .build({
            processing: { roll: false, keep: true, reroll: false },
          }),
      );

      const screen = await render(App);

      await expect
        .element(screen.getByRole("button", { name: "Keep first roll result" }))
        .toBeDisabled();
      await expect.element(screen.getByRole("button", { name: "Reroll same dice" })).toBeDisabled();
    });

    test("disables controls while the session is not ready and action errors are visible", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "decision",
              dices: ["orange"],
              values: [3],
              sum: 3,
              attempt: 1,
            },
          })
          .build({
            status: "stale",
            errors: {
              roll: null,
              keep: null,
              reroll: { reason: "rejected" },
            },
          }),
      );

      const screen = await render(App);

      await expect
        .element(screen.getByRole("button", { name: "Keep first roll result" }))
        .toBeDisabled();
      await expect.element(screen.getByRole("button", { name: "Reroll same dice" })).toBeDisabled();
      await expect.element(screen.getByText("rejected")).toBeVisible();
    });

    test("shows action error before later errors and timeouts", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "decision",
              dices: ["purple"],
              values: [2],
              sum: 2,
              attempt: 1,
            },
          })
          .build({
            errors: {
              roll: { reason: "" },
              keep: { reason: "rejected" },
              reroll: null,
            },
            timeouts: { roll: false, keep: true, reroll: false },
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
              phase: "decision",
              dices: ["yellow"],
              values: [1],
              sum: 1,
              attempt: 1,
            },
          })
          .build({
            timeouts: { roll: false, keep: true, reroll: true },
          }),
      );

      const screen = await render(App);

      await expect.element(screen.getByText("keep timeout")).toBeVisible();
      await expect.element(screen.getByText("reroll timeout")).not.toBeInTheDocument();
    });
  });

  describe("result phase", () => {
    test("preserves roll details without decision controls", async () => {
      sessionMock.set(
        sessionState
          .transient({
            game: {
              phase: "result",
              dices: ["yellow"],
              values: [6],
              sum: 6,
              attempt: 2,
            },
          })
          .build(),
      );

      const screen = await render(App);

      await expect.element(screen.getByLabelText("Rolled sum 6")).toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "yellow die" }))
        .toHaveAttribute("aria-pressed", "true");
      await expect
        .element(screen.getByRole("button", { name: "orange die" }))
        .toHaveAttribute("aria-pressed", "false");
      await expect
        .element(screen.getByRole("button", { name: "Keep first roll result" }))
        .not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Reroll same dice" }))
        .not.toBeInTheDocument();
    });
  });
});
