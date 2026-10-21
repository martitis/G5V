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
      // Colours of the previous panel (Material blue / teal).
      light: {
        dark: false,
        colors: {
          primary: "#2196F3",
          secondary: "#546E7A",
          accent: "#000000",
          error: "#D50000",
          background: "#E1F5FE",
          footer: "#03A9F4"
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: "#009688",
          secondary: "#78909C",
          background: "#303030",
          surface: "#424242",
          footer: "#00796B"
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
