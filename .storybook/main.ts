import type { StorybookConfig } from "@storybook/svelte-vite";

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
};

export default config;
