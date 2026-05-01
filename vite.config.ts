import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  server: {
    port: parseInt(process.env.VITE_PORT || "5173", 10),
    strictPort: true,
  },
  resolve: {
    conditions: ["svelte", "browser", "import", "default"],
    alias: {
      "~": path.resolve(root, "src"),
      "~assets": path.resolve(root, "assets"),
    },
  },
  build: {
    target: "esnext",
  },
  plugins: [svelte()],
});
