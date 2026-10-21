import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import i18n from "./plugins/i18n";
import { loadConfig } from "./config";
import "./styles/main.css";

// The API URL comes from /config.json, so load it before anything talks to the API.
await loadConfig();

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
app.use(vuetify);
app.use(router);
app.mount("#app");
