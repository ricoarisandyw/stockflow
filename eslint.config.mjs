import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: ["src/generated/**", ".obsidian/**", ".agents/**"],
  },
  ...nextConfig,
];

export default eslintConfig;
