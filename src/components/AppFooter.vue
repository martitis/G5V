<template>
  <v-footer app color="secondary" class="flex-column pa-0">
    <div class="d-flex align-center justify-end w-100 px-4 py-1 bg-primary">
      <v-btn icon variant="text" size="small" @click="toggleTheme">
        <v-icon>{{ isDark ? "mdi-weather-sunny" : "mdi-moon-waxing-crescent" }}</v-icon>
        <v-tooltip activator="parent" location="top">{{ $t("Navbar.DarkMode") }}</v-tooltip>
      </v-btn>
      <v-menu location="top">
        <template #activator="{ props }">
          <v-btn icon variant="text" size="small" class="mx-2" v-bind="props">
            <v-icon>mdi-translate</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="lang in languages"
            :key="lang.code"
            :title="lang.name"
            :active="locale === lang.code"
            @click="setLanguage(lang.code)"
          />
        </v-list>
      </v-menu>
      <v-btn icon variant="text" size="small" to="/metrics">
        <v-icon>mdi-information</v-icon>
        <v-tooltip activator="parent" location="top">{{ $t("Footer.metrics") }}</v-tooltip>
      </v-btn>
    </div>
    <div class="text-body-small py-2 text-center w-100">
      {{ new Date().getFullYear() }} — <strong>{{ $t("Footer.company") }}</strong> —
      {{ $t("Footer.powered") }}
    </div>
  </v-footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
import { languages, setLanguage } from "@/plugins/i18n";

const { locale } = useI18n();
const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

function toggleTheme() {
  const next = isDark.value ? "light" : "dark";
  theme.change(next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage unavailable: the choice lasts until reload.
  }
}
</script>
