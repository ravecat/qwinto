import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

function storybookBrowserProvider() {
  return playwright({
    contextOptions: {
      reducedMotion: "reduce",
      viewport: { width: 1280, height: 900 },
      screen: { width: 1280, height: 900 },
    },
  });
}

export default defineConfig({
  server: {
    port: parseInt(process.env.VITE_PORT || "5173", 10),
    strictPort: true,
  },
  resolve: {
    conditions: ["svelte", "browser", "import", "default"],
    alias: {
      "~": path.resolve(root, "src"),
      "~components": path.resolve(root, "src/components"),
      "~store": path.resolve(root, "src/store"),
      "~assets": path.resolve(root, "assets"),
    },
  },
  build: {
    target: "esnext",
  },
  plugins: [svelte()],
  test: {
    outputFile: {
      html: path.join(root, ".vitest/report/index.html"),
    },
    browser: {
      api: { port: 0, strictPort: false },
      enabled: true,
      headless: true,
      trace: "off",
      provider: playwright({
        contextOptions: {
          viewport: { width: 1280, height: 900 },
          screen: { width: 1280, height: 900 },
        },
      }),
      expect: {
        toMatchScreenshot: {
          comparatorName: "pixelmatch",
          comparatorOptions: { allowedMismatchedPixelRatio: 0.001 },
          resolveDiffPath: ({
            arg,
            attachmentsDir,
            browserName,
            ext,
            project,
            root: projectRoot,
            testFileDirectory,
            testFileName,
          }) =>
            path.join(
              projectRoot,
              attachmentsDir,
              testFileDirectory,
              testFileName,
              project.name,
              browserName,
              `${arg}${ext}`,
            ),
          resolveScreenshotPath: ({
            arg,
            browserName,
            ext,
            project,
            root: projectRoot,
            testFileDirectory,
            testFileName,
          }) =>
            path.join(
              projectRoot,
              "__screenshots__",
              testFileDirectory,
              testFileName,
              project.name,
              browserName,
              `${arg}${ext}`,
            ),
        },
      },
    },
    projects: [
      {
        extends: true,
        optimizeDeps: {
          include: ["nanostores"],
        },
        test: {
          name: "browser",
          include: ["tests/**/*.browser.{test,spec}.{js,ts}"],
          sequence: { groupOrder: 0 },
          setupFiles: ["vitest-browser-svelte"],
          browser: {
            instances: [
              {
                browser: "chromium",
                screenshotDirectory: path.join(
                  root,
                  ".vitest-attachments/failures/browser/chromium",
                ),
              },
            ],
          },
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(root, ".storybook"),
            initialGlobals: {
              theme: "light",
              viewport: { value: "desktop" },
            },
          }),
        ],
        test: {
          fileParallelism: true,
          maxWorkers: 2,
          maxConcurrency: 1,
          sequence: { groupOrder: 1 },
          setupFiles: [path.join(root, ".storybook/vitest.setup.ts")],
          browser: {
            provider: storybookBrowserProvider(),
            instances: [
              {
                browser: "chromium",
                name: "desktop",
                screenshotDirectory: path.join(
                  root,
                  ".vitest-attachments/failures/desktop/chromium",
                ),
              },
            ],
          },
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(root, ".storybook"),
            initialGlobals: {
              theme: "light",
              viewport: { value: "tablet" },
            },
          }),
        ],
        test: {
          fileParallelism: true,
          maxWorkers: 2,
          maxConcurrency: 1,
          sequence: { groupOrder: 2 },
          setupFiles: [path.join(root, ".storybook/vitest.setup.ts")],
          browser: {
            provider: storybookBrowserProvider(),
            instances: [
              {
                browser: "chromium",
                name: "tablet",
                screenshotDirectory: path.join(
                  root,
                  ".vitest-attachments/failures/tablet/chromium",
                ),
              },
            ],
          },
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(root, ".storybook"),
            initialGlobals: {
              theme: "light",
              viewport: { value: "mobile" },
            },
          }),
        ],
        test: {
          fileParallelism: true,
          maxWorkers: 2,
          maxConcurrency: 1,
          sequence: { groupOrder: 3 },
          setupFiles: [path.join(root, ".storybook/vitest.setup.ts")],
          browser: {
            provider: storybookBrowserProvider(),
            instances: [
              {
                browser: "chromium",
                name: "mobile",
                screenshotDirectory: path.join(
                  root,
                  ".vitest-attachments/failures/mobile/chromium",
                ),
              },
            ],
          },
        },
      },
    ],
  },
});
