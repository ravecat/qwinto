import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render } from "vitest-browser-svelte";
import D6 from "~components/d6.svelte";

describe("D6", () => {
  afterEach(() => {
    cleanup();
  });

  test.each([
    { value: Number.NaN, expected: 1 },
    { value: -4, expected: 1 },
    { value: 0, expected: 1 },
    { value: 1, expected: 1 },
    { value: 6, expected: 6 },
    { value: 8, expected: 6 },
  ])("renders $expected pips for value $value", async ({ value, expected }) => {
    const screen = await render(D6, { value });

    expect(screen.container.querySelector("[data-die-value]")?.getAttribute("data-die-value")).toBe(
      String(expected),
    );
    expect(screen.container.querySelectorAll("[data-die-pip]")).toHaveLength(expected);
  });

  test.each([{ props: {} }, { props: { value: null } }])(
    "renders no pips without a value",
    async ({ props }) => {
      const screen = await render(D6, props);

      expect(screen.container.querySelector("[data-die-value]")).toBeNull();
      expect(screen.container.querySelectorAll("[data-die-pip]")).toHaveLength(0);
    },
  );
});
