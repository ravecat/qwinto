/** @type {import("prettier").Config} */
export default {
  plugins: ["@prettier/plugin-xml"],
  overrides: [
    {
      files: ["assets/**/*.svg"],
      options: {
        parser: "xml",
        printWidth: 100,
        singleAttributePerLine: true,
        xmlWhitespaceSensitivity: "ignore",
      },
    },
  ],
};
