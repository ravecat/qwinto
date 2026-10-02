import type {} from "@vitest/browser-playwright";
import { cdp } from "vitest/browser";
import { afterEach, beforeEach, expect } from "vitest";

beforeEach(async () => {
  await cdp().send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: -10,
    y: -10,
    buttons: 0,
  });
});

afterEach(async () => {
  await expect(document.documentElement).toMatchScreenshot({ timeout: 15_000 });
});
