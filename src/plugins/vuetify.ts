import "@mdi/font/css/materialdesignicons.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";

/** Saved by the theme toggle in the footer. */
export function savedTheme(): "light" | "dark" {
  try {
    // The old panel stored "true" for dark mode.
    const stored = localStorage.getItem("theme");
    return stored === "dark" || stored === "true" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default createVuetify({
  theme: {
    // Vuetify 4 defaults to the system theme; the panel has its own toggle.
    defaultTheme: savedTheme(),
    themes: {
      // Colours of the previous panel (Material blue). appbar/footer: the top bar and the footer.
      light: {
        dark: false,
        colors: {
          primary: "#2196F3",
          secondary: "#546E7A",
          accent: "#000000",
          error: "#D50000",
          background: "#E1F5FE",
          appbar: "#2196F3",
          footer: "#546E7A"
        }
      },
      // Neutral slate greys with the same blue as light mode, so dark pages don't glare.
      dark: {
        dark: true,
        colors: {
          primary: "#60A5FA",
          secondary: "#94A3B8",
          accent: "#A78BFA",
          error: "#F87171",
          info: "#38BDF8",
          success: "#4ADE80",
          warning: "#FBBF24",
          background: "#0F1115",
          surface: "#181B21",
          "surface-bright": "#22262E",
          "surface-variant": "#2A2F38",
          "on-surface-variant": "#CBD5E1",
          appbar: "#181B21",
          footer: "#181B21"
        }
      }
    }
  },
  defaults: {
    VBtn: { variant: "flat" },
    VTextField: { variant: "outlined", density: "comfortable" },
    VSelect: { variant: "outlined", density: "comfortable" },
    VAutocomplete: { variant: "outlined", density: "comfortable" },
    VCombobox: { variant: "outlined", density: "comfortable" },
    VTextarea: { variant: "outlined", density: "comfortable" },
    VFileInput: { variant: "outlined", density: "comfortable" }
  }
});
