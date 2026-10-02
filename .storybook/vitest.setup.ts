import { afterEach, beforeEach, expect } from "vitest";

async function loadFonts() {
  for (const { family, weights, samples } of [
    { family: "Source Code Pro", weights: [400, 700], samples: ["A", "Ж"] },
  ]) {
    for (const weight of weights) {
      for (const text of samples) {
        const faces = await document.fonts.load(`${weight} 16px "${family}"`, text);
        expect(faces.length, `${family} ${weight} unavailable for ${text}`).toBeGreaterThan(0);
        expect(faces.every((face) => face.status === "loaded")).toBe(true);
      }
    }
  }
  await Promise.all(Array.from(document.fonts, (font) => font.load()));
  await document.fonts.ready;
}

beforeEach(loadFonts);

afterEach(async () => {
  await loadFonts();
  await expect(document.documentElement).toMatchScreenshot();
});
