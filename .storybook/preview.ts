import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/svelte-vite";
import "../src/app.css";
import "./preview.css";

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "dark",
      attributeName: "data-theme",
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      options: {
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "720px" },
          type: "desktop",
        },
        tablet: {
          name: "Tablet landscape",
          styles: { width: "1024px", height: "640px" },
          type: "tablet",
        },
        mobile: {
          name: "Mobile",
          styles: { width: "320px", height: "900px" },
          type: "mobile",
        },
      },
    },
  },
};

export default preview;
