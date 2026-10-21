// Checks that every translation key used in src/ exists in English (other languages fall back to English).
// Usage: node scripts/check-i18n.mjs   (exits 1 when keys are missing)
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const messages = JSON.parse(readFileSync("src/translations/translations.json", "utf8"));
const has = (lang, key) => key.split(".").reduce((node, part) => node?.[part], messages[lang]) != null;

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(vue|ts)$/.test(name)) files.push(path);
  }
};
walk("src");

const missing = new Map();
const untranslated = { fr: 0, ja: 0 };
for (const file of files) {
  const source = readFileSync(file, "utf8");
  // $t("Section.Key") and t("Section.Key") with a literal key.
  for (const match of source.matchAll(/(?:\$t|\bt)\(\s*["'`]([A-Za-z0-9_]+\.[A-Za-z0-9_.]+)["'`]/g)) {
    const key = match[1];
    if (!has("en", key)) missing.set(key, file);
    for (const lang of ["fr", "ja"]) if (!has(lang, key)) untranslated[lang]++;
  }
}
for (const [key, file] of missing) console.error(`missing in en: ${key} (${file})`);
console.log(`checked ${files.length} files; not yet translated (shown in English): fr ${untranslated.fr}, ja ${untranslated.ja}`);
process.exit(missing.size ? 1 : 0);
