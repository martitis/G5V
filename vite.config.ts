import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
  plugins: [
    vue(),
    // Imports only the Vuetify components that are used.
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    // Reachable from the LAN (game servers, phones), not just localhost.
    host: true,
    port: 5173,
    proxy: {
      // Same layout as production behind nginx/Caddy: the API lives under /api.
      "/api": {
        target: "http://localhost:3301",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },
  optimizeDeps: {
    // Vuetify 4: pre-bundle overlay modules together, or menus inside dialogs can open behind them in dev mode.
    include: [
      "vuetify/components/VOverlay",
      "vuetify/components/VDialog",
      "vuetify/components/VMenu",
      "vuetify/components/VSelect",
      "vuetify/components/VTooltip"
    ]
  }
});
