import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default defineConfigWithVueTs(
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  {
    rules: {
      // Many API payloads are loosely typed for now; tighten as the API module types grow.
      "@typescript-eslint/no-explicit-any": "off",
      "vue/multi-word-component-names": "off"
    }
  },
  // Formatting is Prettier's job.
  skipFormatting
);
