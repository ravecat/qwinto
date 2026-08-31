import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/svelte-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|svelte)"],
  addons: ["@storybook/addon-svelte-csf", "@storybook/addon-themes", "@storybook/addon-vitest"],
  framework: "@storybook/svelte-vite",
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: {
    sidebarOnboardingChecklist: false,
  },
  viteFinal: (config) =>
    mergeConfig(config, {
      resolve: {
        alias: {
          "@rvct/d20sdk": fileURLToPath(new URL("../stories/mocks/d20sdk.ts", import.meta.url)),
        },
      },
    }),
};

export default config;
