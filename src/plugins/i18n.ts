import { createI18n } from "vue-i18n";
import messages from "@/translations/translations.json";

export const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ja", name: "日本語" }
] as const;

export type LanguageCode = (typeof languages)[number]["code"];

function savedLanguage(): LanguageCode {
  try {
    // "jp" was the old panel's code for Japanese.
    const stored = localStorage.getItem("language")?.replace(/^jp$/, "ja");
    return languages.some((lang) => lang.code === stored) ? (stored as LanguageCode) : "en";
  } catch {
    return "en";
  }
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: savedLanguage(),
  // Missing keys in fr/ja show the English text instead of the raw key.
  fallbackLocale: "en",
  messages
});

export function setLanguage(code: LanguageCode) {
  i18n.global.locale.value = code;
  document.documentElement.lang = code;
  try {
    localStorage.setItem("language", code);
  } catch {
    // Storage unavailable (private mode): the choice lasts until reload.
  }
}

export default i18n;
