import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
    },
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
    projects: [
      {
        extends: true,
        optimizeDeps: {
          include: ["nanostores"],
        },
        test: {
          name: "browser",
          include: ["tests/**/*.browser.{test,spec}.{js,ts}"],
          setupFiles: ["vitest-browser-svelte"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
